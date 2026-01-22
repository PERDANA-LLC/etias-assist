import Stripe from "stripe";
import { getProductLineItems } from "./products";
import * as db from "../db";
import { SERVICE_FEE_CENTS, SERVICE_FEE_CURRENCY } from "../../shared/etias";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

interface CreateCheckoutSessionParams {
  applicationId: number;
  userId: number;
  userEmail?: string;
  userName?: string;
  origin: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const { applicationId, userId, userEmail, userName, origin } = params;

  // Create payment record first
  const paymentId = await db.createPayment({
    applicationId,
    userId,
    amount: SERVICE_FEE_CENTS,
    currency: SERVICE_FEE_CURRENCY,
    status: "pending"
  });

  // Update application status
  await db.updateApplication(applicationId, {
    status: "payment_pending"
  });

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: getProductLineItems(applicationId),
    mode: "payment",
    success_url: `${origin}/success/${applicationId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment/${applicationId}?cancelled=true`,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      user_id: userId.toString(),
      application_id: applicationId.toString(),
      customer_email: userEmail || "",
      customer_name: userName || "",
      payment_id: paymentId.toString()
    },
    billing_address_collection: "required",
    payment_intent_data: {
      metadata: {
        user_id: userId.toString(),
        application_id: applicationId.toString(),
        payment_id: paymentId.toString()
      }
    }
  });

  // Track analytics
  await db.createAnalyticsEvent({
    userId,
    eventType: "checkout_session_created",
    eventData: { applicationId, paymentId, sessionId: session.id }
  });

  return {
    sessionId: session.id,
    url: session.url,
    paymentId
  };
}

export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId);
}
