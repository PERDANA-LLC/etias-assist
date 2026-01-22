import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SUPER_ADMIN_EMAIL = "superadmin@guest.com";
const SUPER_ADMIN_PASSWORD = "guest.com@superadmin1";
const SUPER_ADMIN_OPEN_ID = "super_admin_local_auth";

export async function seedSuperAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error("[Seed] DATABASE_URL not set");
    return false;
  }

  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // Check if super admin already exists
    const existing = await db.select().from(users)
      .where(eq(users.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    if (existing.length > 0) {
      console.log("[Seed] Super admin already exists");
      return true;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    // Create super admin user
    await db.insert(users).values({
      openId: SUPER_ADMIN_OPEN_ID,
      name: "Super Admin",
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      loginMethod: "local",
      role: "super_admin",
      isImmutable: true,
    });

    console.log("[Seed] Super admin created successfully");
    return true;
  } catch (error) {
    console.error("[Seed] Failed to create super admin:", error);
    return false;
  }
}

// Export constants for use in auth
export { SUPER_ADMIN_EMAIL, SUPER_ADMIN_OPEN_ID };
