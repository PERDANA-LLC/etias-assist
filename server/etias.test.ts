import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { ETIAS_ELIGIBLE_COUNTRIES, SERVICE_FEE_CENTS, SERVICE_FEE_CURRENCY } from "../shared/etias";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser | null): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {
        origin: "https://test.example.com"
      },
      get: (header: string) => header === "host" ? "test.example.com" : undefined
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthenticatedUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides
  };
}

function createAdminUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return createAuthenticatedUser({
    role: "admin",
    ...overrides
  });
}

describe("ETIAS Eligibility Check", () => {
  it("should return eligible for US citizens with valid passport", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.eligibility.check({
      nationality: "United States",
      hasValidPassport: true,
      travelPurpose: "tourism"
    });

    expect(result.isEligible).toBe(true);
    expect(result.requiresVisa).toBe(false);
    expect(result.reason).toContain("eligible");
  });

  it("should return ineligible for non-ETIAS countries", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.eligibility.check({
      nationality: "Russia",
      hasValidPassport: true,
      travelPurpose: "tourism"
    });

    expect(result.isEligible).toBe(false);
    expect(result.requiresVisa).toBe(true);
  });

  it("should return ineligible without valid passport", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.eligibility.check({
      nationality: "United States",
      hasValidPassport: false,
      travelPurpose: "tourism"
    });

    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("passport");
  });

  it("should return list of eligible countries", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const countries = await caller.eligibility.getEligibleCountries();

    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);
    expect(countries).toContain("United States");
    expect(countries).toContain("Canada");
    expect(countries).toContain("Australia");
  });
});

describe("ETIAS Constants", () => {
  it("should have valid service fee configuration", () => {
    expect(SERVICE_FEE_CENTS).toBeGreaterThan(0);
    expect(SERVICE_FEE_CURRENCY).toBe("EUR");
  });

  it("should have comprehensive list of eligible countries", () => {
    expect(ETIAS_ELIGIBLE_COUNTRIES.length).toBeGreaterThan(50);
    
    // Check for major ETIAS-eligible countries
    const majorCountries = [
      "United States",
      "Canada",
      "Australia",
      "Japan",
      "South Korea",
      "United Kingdom",
      "Brazil",
      "Mexico"
    ];
    
    majorCountries.forEach(country => {
      expect(ETIAS_ELIGIBLE_COUNTRIES).toContain(country);
    });
  });

  it("should not include EU/Schengen countries in eligible list", () => {
    const euCountries = ["Germany", "France", "Italy", "Spain", "Netherlands"];
    
    euCountries.forEach(country => {
      expect(ETIAS_ELIGIBLE_COUNTRIES).not.toContain(country);
    });
  });
});

describe("Auth Procedures", () => {
  it("should return user for authenticated requests", async () => {
    const user = createAuthenticatedUser();
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("should return null for unauthenticated requests", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("should clear cookie on logout", async () => {
    const user = createAuthenticatedUser();
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

describe("Help System", () => {
  it("should have HELP_TOPICS constant defined", async () => {
    // HELP_TOPICS is imported from shared/etias and used in the help router
    const { HELP_TOPICS } = await import("@shared/etias");
    
    expect(HELP_TOPICS).toBeDefined();
    expect(Object.keys(HELP_TOPICS).length).toBeGreaterThan(0);
    
    // Check for essential topics
    const topicValues = Object.values(HELP_TOPICS) as string[];
    expect(topicValues.some(t => t.toLowerCase().includes("eligibility"))).toBe(true);
  });
});

describe("Admin Access Control", () => {
  it("should allow admin to access admin stats", async () => {
    const admin = createAdminUser();
    const ctx = createMockContext(admin);
    const caller = appRouter.createCaller(ctx);

    // This should not throw
    const stats = await caller.admin.getStats();
    expect(stats).toBeDefined();
    expect(stats.users).toBeDefined();
    expect(stats.applications).toBeDefined();
  });

  it("should deny non-admin access to admin stats", async () => {
    const user = createAuthenticatedUser({ role: "user" });
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });

  it("should deny unauthenticated access to admin stats", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow();
  });
});
