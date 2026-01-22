import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../../drizzle/schema";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { Request, Response } from "express";
import { ENV } from "../_core/env";

// Use the same secret as the SDK for session verification
const getSessionSecret = () => new TextEncoder().encode(ENV.cookieSecret);

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

    // Create JWT token using the same format as SDK
    const issuedAt = Date.now();
    const expiresInMs = ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = getSessionSecret();

    const token = await new SignJWT({
      openId: user.openId,
      appId: ENV.appId,
      name: user.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

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
