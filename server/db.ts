import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  applications, InsertApplication, Application,
  payments, InsertPayment,
  eligibilityChecks, InsertEligibilityCheck,
  notifications, InsertNotification,
  analyticsEvents, InsertAnalyticsEvent,
  helpQueries, InsertHelpQuery
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

// ============ APPLICATION HELPERS ============

export async function createApplication(data: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(data);
  return result[0].insertId;
}

export async function updateApplication(id: number, data: Partial<InsertApplication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getApplicationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
}

export async function getUserDraftApplication(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(applications)
    .where(and(
      eq(applications.userId, userId),
      eq(applications.status, "draft")
    ))
    .orderBy(desc(applications.createdAt))
    .limit(1);
  
  return result[0];
}

export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationStats() {
  const db = await getDb();
  if (!db) return { total: 0, byStatus: {} };
  
  const total = await db.select({ count: count() }).from(applications);
  const byStatus = await db.select({
    status: applications.status,
    count: count()
  }).from(applications).groupBy(applications.status);
  
  return {
    total: total[0]?.count ?? 0,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s.count]))
  };
}

// ============ PAYMENT HELPERS ============

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function getPaymentByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments)
    .where(eq(payments.applicationId, applicationId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  
  return result[0];
}

export async function getPaymentByStripeId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments)
    .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);
  
  return result[0];
}

export async function getPaymentStats() {
  const db = await getDb();
  if (!db) return { total: 0, totalAmount: 0, byStatus: {} };
  
  const total = await db.select({ 
    count: count(),
    totalAmount: sql<number>`SUM(amount)`
  }).from(payments).where(eq(payments.status, "succeeded"));
  
  const byStatus = await db.select({
    status: payments.status,
    count: count()
  }).from(payments).groupBy(payments.status);
  
  return {
    total: total[0]?.count ?? 0,
    totalAmount: total[0]?.totalAmount ?? 0,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s.count]))
  };
}

// ============ ELIGIBILITY CHECK HELPERS ============

export async function createEligibilityCheck(data: InsertEligibilityCheck) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(eligibilityChecks).values(data);
  return result[0].insertId;
}

export async function getEligibilityStats() {
  const db = await getDb();
  if (!db) return { total: 0, eligible: 0, ineligible: 0 };
  
  const stats = await db.select({
    isEligible: eligibilityChecks.isEligible,
    count: count()
  }).from(eligibilityChecks).groupBy(eligibilityChecks.isEligible);
  
  const eligible = stats.find(s => s.isEligible)?.count ?? 0;
  const ineligible = stats.find(s => !s.isEligible)?.count ?? 0;
  
  return {
    total: eligible + ineligible,
    eligible,
    ineligible
  };
}

// ============ NOTIFICATION HELPERS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function updateNotification(id: number, data: Partial<InsertNotification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set(data).where(eq(notifications.id, id));
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(notifications)
    .where(eq(notifications.status, "pending"))
    .orderBy(notifications.createdAt);
}

// ============ ANALYTICS HELPERS ============

export async function createAnalyticsEvent(data: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { totalEvents: 0, byType: {} };
  
  let query = db.select({
    eventType: analyticsEvents.eventType,
    count: count()
  }).from(analyticsEvents);
  
  if (startDate && endDate) {
    query = query.where(and(
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )) as typeof query;
  }
  
  const byType = await query.groupBy(analyticsEvents.eventType);
  const totalEvents = byType.reduce((sum, e) => sum + e.count, 0);
  
  return {
    totalEvents,
    byType: Object.fromEntries(byType.map(e => [e.eventType, e.count]))
  };
}

export async function getDailyStats(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.select({
    date: sql<string>`DATE(createdAt)`,
    count: count()
  }).from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, startDate))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);
  
  return result;
}

// ============ HELP QUERY HELPERS ============

export async function createHelpQuery(data: InsertHelpQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(helpQueries).values(data);
  return result[0].insertId;
}

export async function updateHelpQueryFeedback(id: number, helpful: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(helpQueries).set({ helpful }).where(eq(helpQueries.id, id));
}

export async function getHelpQueryStats() {
  const db = await getDb();
  if (!db) return { total: 0, helpful: 0, notHelpful: 0 };
  
  const total = await db.select({ count: count() }).from(helpQueries);
  const helpful = await db.select({ count: count() }).from(helpQueries).where(eq(helpQueries.helpful, true));
  const notHelpful = await db.select({ count: count() }).from(helpQueries).where(eq(helpQueries.helpful, false));
  
  return {
    total: total[0]?.count ?? 0,
    helpful: helpful[0]?.count ?? 0,
    notHelpful: notHelpful[0]?.count ?? 0
  };
}


// ============ ADDITIONAL HELPERS ============

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updatePaymentByApplicationId(applicationId: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(data).where(eq(payments.applicationId, applicationId));
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0];
}
