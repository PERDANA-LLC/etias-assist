import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { 
  ETIAS_ELIGIBLE_COUNTRIES, 
  SERVICE_FEE_CENTS, 
  SERVICE_FEE_CURRENCY,
  HELP_TOPICS 
} from "../shared/etias";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Eligibility Check
  eligibility: router({
    check: publicProcedure
      .input(z.object({
        nationality: z.string(),
        hasValidPassport: z.boolean(),
        travelPurpose: z.string().optional(),
        sessionId: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const isEligible = ETIAS_ELIGIBLE_COUNTRIES.includes(input.nationality);
        let eligibilityReason = "";
        
        if (!isEligible) {
          eligibilityReason = `Citizens of ${input.nationality} do not require ETIAS authorization. Your country may require a Schengen visa instead, or you may be an EU/EEA citizen who does not need travel authorization.`;
        } else if (!input.hasValidPassport) {
          eligibilityReason = "You need a valid passport to apply for ETIAS. Please ensure your passport is valid for at least 3 months beyond your planned stay.";
        } else {
          eligibilityReason = `As a citizen of ${input.nationality}, you are eligible to apply for ETIAS authorization for travel to the Schengen Area.`;
        }

        // Log the eligibility check
        await db.createEligibilityCheck({
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          nationality: input.nationality,
          hasValidPassport: input.hasValidPassport,
          travelPurpose: input.travelPurpose,
          isEligible: isEligible && input.hasValidPassport,
          eligibilityReason
        });

        // Track analytics
        await db.createAnalyticsEvent({
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          eventType: "eligibility_check",
          eventData: { nationality: input.nationality, isEligible }
        });

        return {
          isEligible: isEligible && input.hasValidPassport,
          reason: eligibilityReason,
          requiresVisa: !isEligible,
          nextSteps: isEligible && input.hasValidPassport 
            ? "You can proceed with your ETIAS application preparation."
            : "Please check the visa requirements for your nationality."
        };
      }),
      
    getEligibleCountries: publicProcedure.query(() => ETIAS_ELIGIBLE_COUNTRIES),
  }),

  // Application Management
  application: router({
    create: protectedProcedure
      .input(z.object({
        nationality: z.string(),
        travelPurpose: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createApplication({
          userId: ctx.user.id,
          nationality: input.nationality,
          travelPurpose: input.travelPurpose,
          status: "draft",
          currentStep: 1,
          completedSteps: []
        });

        await db.createAnalyticsEvent({
          userId: ctx.user.id,
          eventType: "application_started",
          eventData: { applicationId: id }
        });

        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          // Personal info
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          dateOfBirth: z.date().optional(),
          placeOfBirth: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          // Passport info
          passportNumber: z.string().optional(),
          passportIssuingCountry: z.string().optional(),
          passportIssueDate: z.date().optional(),
          passportExpiryDate: z.date().optional(),
          // Contact info
          phoneNumber: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          // Travel details
          destinationCountries: z.array(z.string()).optional(),
          plannedArrivalDate: z.date().optional(),
          plannedDepartureDate: z.date().optional(),
          accommodationAddress: z.string().optional(),
          emergencyContactName: z.string().optional(),
          emergencyContactPhone: z.string().optional(),
          // Security questions
          hasCriminalRecord: z.boolean().optional(),
          hasVisaDenied: z.boolean().optional(),
          hasDeportationHistory: z.boolean().optional(),
          // Progress
          currentStep: z.number().optional(),
          completedSteps: z.array(z.number()).optional(),
          status: z.enum([
            "draft", "eligibility_checked", "form_completed",
            "payment_pending", "payment_completed", "ready_to_submit", "redirected"
          ]).optional()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.id);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }

        await db.updateApplication(input.id, input.data);
        
        await db.createAnalyticsEvent({
          userId: ctx.user.id,
          eventType: "application_updated",
          eventData: { applicationId: input.id, step: input.data.currentStep }
        });

        return { success: true };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.id);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }
        return app;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApplicationsByUserId(ctx.user.id);
    }),

    getDraft: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDraftApplication(ctx.user.id);
    }),

    markRedirected: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.id);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }

        await db.updateApplication(input.id, {
          status: "redirected",
          redirectedAt: new Date()
        });

        await db.createAnalyticsEvent({
          userId: ctx.user.id,
          eventType: "application_redirected",
          eventData: { applicationId: input.id }
        });

        return { success: true };
      }),
  }),

  // Payment
  payment: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }

        const { createCheckoutSession } = await import("./stripe/checkout");
        const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get('host')}`;
        
        const session = await createCheckoutSession({
          applicationId: input.applicationId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || undefined,
          userName: ctx.user.name || undefined,
          origin
        });

        return {
          sessionId: session.sessionId,
          url: session.url,
          paymentId: session.paymentId
        };
      }),

    createIntent: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }

        // Create payment record
        const paymentId = await db.createPayment({
          applicationId: input.applicationId,
          userId: ctx.user.id,
          amount: SERVICE_FEE_CENTS,
          currency: SERVICE_FEE_CURRENCY,
          status: "pending"
        });

        // Update application status
        await db.updateApplication(input.applicationId, {
          status: "payment_pending"
        });

        await db.createAnalyticsEvent({
          userId: ctx.user.id,
          eventType: "payment_initiated",
          eventData: { applicationId: input.applicationId, paymentId }
        });

        return {
          paymentId,
          amount: SERVICE_FEE_CENTS,
          currency: SERVICE_FEE_CURRENCY,
          // Client secret would come from Stripe in real implementation
          clientSecret: `pi_${Date.now()}_secret`
        };
      }),

    confirmPayment: protectedProcedure
      .input(z.object({
        paymentId: z.number(),
        stripePaymentIntentId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updatePayment(input.paymentId, {
          stripePaymentIntentId: input.stripePaymentIntentId,
          status: "succeeded",
          completedAt: new Date()
        });

        // Get payment to find application
        const payment = await db.getPaymentByStripeId(input.stripePaymentIntentId);
        if (payment) {
          await db.updateApplication(payment.applicationId, {
            status: "ready_to_submit"
          });

          // Create notification
          await db.createNotification({
            userId: ctx.user.id,
            applicationId: payment.applicationId,
            type: "payment_received",
            channel: "email",
            recipientEmail: ctx.user.email || undefined,
            subject: "Payment Confirmed - ETIAS Application Ready",
            content: "Your payment has been confirmed. Your ETIAS application is now ready to submit on the official EU website."
          });
        }

        await db.createAnalyticsEvent({
          userId: ctx.user.id,
          eventType: "payment_completed",
          eventData: { paymentId: input.paymentId }
        });

        return { success: true };
      }),

    getStatus: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const app = await db.getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }

        const payment = await db.getPaymentByApplicationId(input.applicationId);
        return payment;
      }),
  }),

  // AI Help Assistant
  help: router({
    ask: publicProcedure
      .input(z.object({
        question: z.string(),
        context: z.string().optional(),
        sessionId: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const systemPrompt = `You are a helpful assistant for the ETIAS Travel Authorization Assistance Platform. 
Your role is to answer questions about:
- ETIAS eligibility requirements
- The application process
- Required documents
- Processing times and validity
- Travel rules in the Schengen Area

Important guidelines:
- Be accurate and helpful
- If you're unsure, recommend checking the official EU ETIAS website
- Never provide legal advice
- Remind users that this platform helps prepare applications but does not submit them
- Keep responses concise and clear

Available topics: ${Object.values(HELP_TOPICS).join(', ')}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.question }
            ]
          });

          const rawAnswer = response.choices[0]?.message?.content;
          const answer = typeof rawAnswer === 'string' ? rawAnswer : "I'm sorry, I couldn't process your question. Please try again or contact support.";

          // Log the help query
          const queryId = await db.createHelpQuery({
            userId: ctx.user?.id,
            sessionId: input.sessionId,
            question: input.question,
            answer,
            context: input.context
          });

          await db.createAnalyticsEvent({
            userId: ctx.user?.id,
            sessionId: input.sessionId,
            eventType: "help_query",
            eventData: { context: input.context }
          });

          return { answer, queryId };
        } catch (error) {
          console.error("Help query error:", error);
          return {
            answer: "I'm having trouble processing your question right now. Please try again later or visit the official ETIAS website for information.",
            queryId: null
          };
        }
      }),

    feedback: publicProcedure
      .input(z.object({
        queryId: z.number(),
        helpful: z.boolean()
      }))
      .mutation(async ({ input }) => {
        await db.updateHelpQueryFeedback(input.queryId, input.helpful);
        return { success: true };
      }),
  }),

  // Analytics (for tracking)
  analytics: router({
    track: publicProcedure
      .input(z.object({
        eventType: z.string(),
        eventData: z.record(z.string(), z.unknown()).optional(),
        sessionId: z.string().optional(),
        pageUrl: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createAnalyticsEvent({
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          eventType: input.eventType,
          eventData: input.eventData,
          pageUrl: input.pageUrl
        });
        return { success: true };
      }),
  }),

  // Admin Dashboard
  admin: router({
    getStats: adminProcedure.query(async () => {
      const [userCount, appStats, paymentStats, eligibilityStats, helpStats] = await Promise.all([
        db.getUserCount(),
        db.getApplicationStats(),
        db.getPaymentStats(),
        db.getEligibilityStats(),
        db.getHelpQueryStats()
      ]);

      return {
        users: { total: userCount },
        applications: appStats,
        payments: paymentStats,
        eligibility: eligibilityStats,
        helpQueries: helpStats
      };
    }),

    getApplications: adminProcedure.query(async () => {
      return db.getAllApplications();
    }),

    getUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    getDailyStats: adminProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        return db.getDailyStats(input.days ?? 30);
      }),

    getAnalytics: adminProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional()
      }))
      .query(async ({ input }) => {
        return db.getAnalyticsStats(input.startDate, input.endDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
