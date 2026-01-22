import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ETIAS Applications - stores user application data
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "draft",
    "eligibility_checked",
    "form_completed",
    "payment_pending",
    "payment_completed",
    "ready_to_submit",
    "redirected"
  ]).default("draft").notNull(),
  
  // Eligibility data
  nationality: varchar("nationality", { length: 100 }),
  hasValidPassport: boolean("hasValidPassport"),
  travelPurpose: varchar("travelPurpose", { length: 100 }),
  destinationCountries: json("destinationCountries").$type<string[]>(),
  plannedArrivalDate: timestamp("plannedArrivalDate"),
  plannedDepartureDate: timestamp("plannedDepartureDate"),
  isEligible: boolean("isEligible"),
  
  // Personal information (encrypted in practice)
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  dateOfBirth: timestamp("dateOfBirth"),
  placeOfBirth: varchar("placeOfBirth", { length: 200 }),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  
  // Passport information
  passportNumber: varchar("passportNumber", { length: 50 }),
  passportIssuingCountry: varchar("passportIssuingCountry", { length: 100 }),
  passportIssueDate: timestamp("passportIssueDate"),
  passportExpiryDate: timestamp("passportExpiryDate"),
  
  // Contact information
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  addressLine1: varchar("addressLine1", { length: 200 }),
  addressLine2: varchar("addressLine2", { length: 200 }),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }),
  
  // Travel details
  accommodationAddress: text("accommodationAddress"),
  emergencyContactName: varchar("emergencyContactName", { length: 200 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 30 }),
  
  // Security questions
  hasCriminalRecord: boolean("hasCriminalRecord"),
  hasVisaDenied: boolean("hasVisaDenied"),
  hasDeportationHistory: boolean("hasDeportationHistory"),
  
  // Form progress tracking
  currentStep: int("currentStep").default(1),
  completedSteps: json("completedSteps").$type<number[]>(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  redirectedAt: timestamp("redirectedAt"),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Payments - tracks payment transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "succeeded",
    "failed",
    "refunded",
    "cancelled"
  ]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  receiptUrl: text("receiptUrl"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Eligibility checks - logs eligibility check attempts
 */
export const eligibilityChecks = mysqlTable("eligibility_checks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 100 }),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  hasValidPassport: boolean("hasValidPassport").notNull(),
  travelPurpose: varchar("travelPurpose", { length: 100 }),
  isEligible: boolean("isEligible").notNull(),
  eligibilityReason: text("eligibilityReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EligibilityCheck = typeof eligibilityChecks.$inferSelect;
export type InsertEligibilityCheck = typeof eligibilityChecks.$inferInsert;

/**
 * Notifications - email and system notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  applicationId: int("applicationId"),
  type: mysqlEnum("type", [
    "application_started",
    "eligibility_confirmed",
    "payment_received",
    "payment_failed",
    "application_ready",
    "reminder_incomplete",
    "admin_alert"
  ]).notNull(),
  channel: mysqlEnum("channel", ["email", "system"]).default("email").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Analytics events - tracks user interactions for admin dashboard
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 100 }),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventData: json("eventData").$type<Record<string, unknown>>(),
  pageUrl: varchar("pageUrl", { length: 500 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Help queries - stores AI help interactions
 */
export const helpQueries = mysqlTable("help_queries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 100 }),
  question: text("question").notNull(),
  answer: text("answer"),
  context: varchar("context", { length: 100 }), // e.g., "eligibility", "form", "payment"
  helpful: boolean("helpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HelpQuery = typeof helpQueries.$inferSelect;
export type InsertHelpQuery = typeof helpQueries.$inferInsert;
