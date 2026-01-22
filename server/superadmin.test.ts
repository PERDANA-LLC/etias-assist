import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createSuperAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "super_admin_test",
    email: "superadmin@guest.com",
    name: "Super Admin",
    loginMethod: "local",
    role: "super_admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "admin_test",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "user_test",
    email: "user@test.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Super Admin Access Control", () => {
  it("super admin can access admin.getStats", async () => {
    const { ctx } = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should not throw - super admin has access
    await expect(caller.admin.getStats()).resolves.toBeDefined();
  });

  it("admin can access admin.getStats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should not throw - admin has access
    await expect(caller.admin.getStats()).resolves.toBeDefined();
  });

  it("regular user cannot access admin.getStats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should throw FORBIDDEN error
    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });
});

describe("User CRUD Access Control", () => {
  it("super admin can call createUser", async () => {
    const { ctx } = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // This should not throw for super admin (actual DB operation may fail but access is granted)
    try {
      await caller.admin.createUser({
        name: "Test User",
        email: "test@example.com",
        role: "user",
      });
    } catch (error: any) {
      // If it fails, it should not be due to access control
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("admin cannot call createUser (super admin only)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should throw FORBIDDEN error - only super admin can create users
    await expect(
      caller.admin.createUser({
        name: "Test User",
        email: "test@example.com",
        role: "user",
      })
    ).rejects.toThrow("Super admin access required");
  });

  it("admin cannot call deleteUser (super admin only)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should throw FORBIDDEN error - only super admin can delete users
    await expect(
      caller.admin.deleteUser({ id: 999 })
    ).rejects.toThrow("Super admin access required");
  });
});

describe("Auth Procedures", () => {
  it("auth.me returns user info for authenticated user", async () => {
    const { ctx } = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    
    expect(result).toBeDefined();
    expect(result?.email).toBe("superadmin@guest.com");
    expect(result?.role).toBe("super_admin");
  });

  it("auth.logout clears session", async () => {
    const clearedCookies: CookieCall[] = [];
    const user: AuthenticatedUser = {
      id: 1,
      openId: "test",
      email: "test@test.com",
      name: "Test",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });
});
