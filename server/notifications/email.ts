import { notifyOwner } from "../_core/notification";
import * as db from "../db";

interface EmailNotificationParams {
  userId: number;
  applicationId?: number;
  type: "application_started" | "eligibility_confirmed" | "payment_received" | "payment_failed" | "application_ready" | "reminder_incomplete" | "admin_alert";
  recipientEmail?: string;
  subject: string;
  content: string;
}

export async function sendEmailNotification(params: EmailNotificationParams) {
  const { userId, applicationId, type, recipientEmail, subject, content } = params;

  // Create notification record
  const notificationId = await db.createNotification({
    userId,
    applicationId,
    type,
    channel: "email",
    recipientEmail,
    subject,
    content,
    status: "pending"
  });

  try {
    // For now, we use the owner notification system
    // In production, this would integrate with an email service like SendGrid
    const success = await notifyOwner({
      title: `[ETIAS] ${subject}`,
      content: `
User ID: ${userId}
Application ID: ${applicationId || "N/A"}
Email: ${recipientEmail || "Not provided"}

${content}
      `.trim()
    });

    // Update notification status
    await db.updateNotification(notificationId, {
      status: success ? "sent" : "failed",
      sentAt: success ? new Date() : undefined
    });

    return { success, notificationId };
  } catch (error) {
    console.error("Failed to send email notification:", error);
    await db.updateNotification(notificationId, { status: "failed" });
    return { success: false, notificationId };
  }
}

// Notification templates
export const notificationTemplates = {
  applicationStarted: (userName: string) => ({
    subject: "Your ETIAS Application Has Been Started",
    content: `
Dear ${userName},

Thank you for starting your ETIAS application with us. We're here to help you prepare all the necessary information before submitting to the official EU website.

Next steps:
1. Complete the eligibility check
2. Fill in your personal and travel details
3. Review and validate your information
4. Complete payment for our assistance service
5. Submit your application on the official EU ETIAS website

If you have any questions, our AI assistant is available 24/7 to help you.

Best regards,
The ETIAS Assist Team
    `.trim()
  }),

  paymentReceived: (userName: string, applicationId: number) => ({
    subject: "Payment Confirmed - Your ETIAS Application is Ready",
    content: `
Dear ${userName},

Great news! Your payment has been confirmed and your ETIAS application (ID: ${applicationId}) is now ready to submit.

What happens next:
1. Click the "Submit to Official EU Website" button in your dashboard
2. You'll be redirected to the official EU ETIAS portal
3. Your prepared information will help you complete the official form quickly
4. Pay the official EU ETIAS fee (€7)
5. Receive your authorization via email

Remember: We've prepared your application, but you must submit it yourself on the official EU website.

Best regards,
The ETIAS Assist Team
    `.trim()
  }),

  applicationReady: (userName: string) => ({
    subject: "Your ETIAS Application is Ready for Submission",
    content: `
Dear ${userName},

Your ETIAS application has been fully prepared and validated. You can now proceed to submit it on the official EU ETIAS website.

Important reminders:
- Have your passport ready for the official submission
- The official EU ETIAS fee is €7 (separate from our service fee)
- Processing typically takes minutes, but can take up to 4 days
- Your ETIAS authorization is valid for 3 years

Click the "Submit Now" button in your dashboard to proceed.

Best regards,
The ETIAS Assist Team
    `.trim()
  }),

  reminderIncomplete: (userName: string, daysOld: number) => ({
    subject: "Complete Your ETIAS Application",
    content: `
Dear ${userName},

We noticed you started an ETIAS application ${daysOld} days ago but haven't completed it yet.

Don't worry - your progress has been saved! You can continue where you left off at any time.

If you're planning to travel to Europe soon, we recommend completing your application as early as possible to avoid any last-minute issues.

Need help? Our AI assistant is available 24/7 to answer your questions.

Best regards,
The ETIAS Assist Team
    `.trim()
  }),

  adminAlert: (alertType: string, details: string) => ({
    subject: `[Admin Alert] ${alertType}`,
    content: `
Admin Alert: ${alertType}

Details:
${details}

This is an automated notification from the ETIAS Assist platform.
    `.trim()
  })
};

// Send specific notification types
export async function sendApplicationStartedNotification(userId: number, applicationId: number, userEmail?: string, userName?: string) {
  const template = notificationTemplates.applicationStarted(userName || "Valued Customer");
  return sendEmailNotification({
    userId,
    applicationId,
    type: "application_started",
    recipientEmail: userEmail,
    ...template
  });
}

export async function sendPaymentReceivedNotification(userId: number, applicationId: number, userEmail?: string, userName?: string) {
  const template = notificationTemplates.paymentReceived(userName || "Valued Customer", applicationId);
  return sendEmailNotification({
    userId,
    applicationId,
    type: "payment_received",
    recipientEmail: userEmail,
    ...template
  });
}

export async function sendApplicationReadyNotification(userId: number, applicationId: number, userEmail?: string, userName?: string) {
  const template = notificationTemplates.applicationReady(userName || "Valued Customer");
  return sendEmailNotification({
    userId,
    applicationId,
    type: "application_ready",
    recipientEmail: userEmail,
    ...template
  });
}

export async function sendReminderNotification(userId: number, applicationId: number, daysOld: number, userEmail?: string, userName?: string) {
  const template = notificationTemplates.reminderIncomplete(userName || "Valued Customer", daysOld);
  return sendEmailNotification({
    userId,
    applicationId,
    type: "reminder_incomplete",
    recipientEmail: userEmail,
    ...template
  });
}

export async function sendAdminAlert(alertType: string, details: string) {
  const template = notificationTemplates.adminAlert(alertType, details);
  return sendEmailNotification({
    userId: 0, // System notification
    type: "admin_alert",
    ...template
  });
}
