import Stripe from "stripe";
import { Request, Response } from "express";
import * as db from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).send("Missing signature or webhook secret");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events for webhook verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const applicationId = session.metadata?.application_id;
  const paymentIntentId = session.payment_intent as string;

  console.log(`[Webhook] Checkout completed for user ${userId}, application ${applicationId}`);

  if (!userId || !applicationId) {
    console.error("[Webhook] Missing user_id or application_id in metadata");
    return;
  }

  // Update payment record
  await db.updatePaymentByApplicationId(parseInt(applicationId), {
    stripePaymentIntentId: paymentIntentId,
    status: "succeeded",
    completedAt: new Date()
  });

  // Update application status
  await db.updateApplication(parseInt(applicationId), {
    status: "ready_to_submit"
  });

  // Get user for notification
  const user = await db.getUserById(parseInt(userId));
  if (user) {
    // Create notification
    await db.createNotification({
      userId: parseInt(userId),
      applicationId: parseInt(applicationId),
      type: "payment_received",
      channel: "email",
      recipientEmail: user.email || undefined,
      subject: "Payment Confirmed - ETIAS Application Ready",
      content: "Your payment has been confirmed. Your ETIAS application is now ready to submit on the official EU website."
    });
  }

  // Track analytics
  await db.createAnalyticsEvent({
    userId: parseInt(userId),
    eventType: "payment_completed",
    eventData: { applicationId, paymentIntentId }
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
  
  // Update payment if exists
  const payment = await db.getPaymentByStripeId(paymentIntent.id);
  if (payment) {
    await db.updatePayment(payment.id, {
      status: "succeeded",
      completedAt: new Date()
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
  
  // Update payment if exists
  const payment = await db.getPaymentByStripeId(paymentIntent.id);
  if (payment) {
    await db.updatePayment(payment.id, {
      status: "failed"
    });

    // Create notification about failed payment
    await db.createNotification({
      userId: payment.userId,
      applicationId: payment.applicationId,
      type: "payment_failed",
      channel: "email",
      subject: "Payment Failed - Action Required",
      content: "Your payment could not be processed. Please try again or use a different payment method."
    });
  }
}
