import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../../drizzle/schema";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "../../shared/const";
import { Request, Response } from "express";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export async function handleLocalLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Database not configured" });
  }

  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // Find user by email
    const result = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last signed in
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    // Create JWT token
    const token = await new SignJWT({
      sub: user.openId,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Set cookie
    const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LocalAuth] Login error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
