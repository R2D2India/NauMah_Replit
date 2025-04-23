import { Request, Response, NextFunction, Express } from "express";
import { db } from "./db";
import { users, passwordResetTokens, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// TypeScript utility to augment the Express.User type
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      profilePicture: string | null;
      isEmailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Create PostgreSQL session store
const PgStore = connectPgSimple(session);

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function setupAuth(app: Express) {
  // Set up session middleware
  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: "user_sessions", // Use existing user_sessions table
        createTableIfMissing: false, // Don't try to create the table
      }),
      secret: process.env.SESSION_SECRET || "naumah-auth-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport to use local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Check password
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Ensure isEmailVerified is a boolean (not null)
        const userWithBooleanEmailVerified = {
          ...user,
          isEmailVerified: user.isEmailVerified || false
        };
        
        return done(null, userWithBooleanEmailVerified);
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      
      if (!user) {
        return done(null, false);
      }
      
      // Remove password and fix isEmailVerified type
      const { password, ...userWithoutPassword } = user;
      
      // Ensure isEmailVerified is boolean
      const fixedUser = {
        ...userWithoutPassword,
        isEmailVerified: userWithoutPassword.isEmailVerified || false
      };
      
      done(null, fixedUser as Express.User);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        mobileNumber, 
        age, 
        pregnancyStage 
      } = req.body;

      // Check if username already exists
      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Determine which pregnancy field to set based on the selected type
      let pregnancyWeek = null;
      let pregnancyMonth = null;
      let pregnancyTrimester = null;

      if (pregnancyStage && pregnancyStage.type && pregnancyStage.value) {
        const value = Number(pregnancyStage.value);
        if (pregnancyStage.type === "week") {
          pregnancyWeek = value;
        } else if (pregnancyStage.type === "month") {
          pregnancyMonth = value;
        } else if (pregnancyStage.type === "trimester") {
          pregnancyTrimester = value;
        }
      }

      // Insert user into database
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          mobileNumber: mobileNumber || null,
          age: age ? Number(age) : null,
          pregnancyWeek,
          pregnancyMonth,
          pregnancyTrimester,
          profilePicture: null,
          isEmailVerified: false,
        })
        .returning();

      // Set session
      req.session.userId = newUser.id;

      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('./email');
        await sendWelcomeEmail({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          username: newUser.username
        });
        console.log(`Welcome email sent successfully to ${newUser.email}`);
      } catch (emailError) {
        // Log error but don't fail registration
        console.error("Error sending welcome email:", emailError);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "An error occurred during registration" });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user by username
      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const passwordValid = await comparePasswords(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "An error occurred during login" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });

      if (!user) {
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
        });
        return res.status(401).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user information" });
    }
  });

  // Forgot password
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // If no user found, still return success to prevent user enumeration
      if (!user) {
        return res.status(200).json({ message: "Password reset email sent if account exists" });
      }

      // Generate token
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
        isUsed: false,
      });

      // Send password reset email
      try {
        const { sendEmail, NAUMAH_SUPPORT_EMAIL } = await import('./email');
        
        // Determine the appropriate app URL
        const appUrl = process.env.APP_URL || 'https://naumah.com';
        const resetLink = `${appUrl}/auth?token=${token}`;
        
        const subject = 'Reset Your NauMah Password';
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your NauMah Password</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #FF8080 0%, #FF4D4D 100%);
                color: white;
                padding: 25px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background-color: #ffffff;
                padding: 30px;
                border-left: 1px solid #eeeeee;
                border-right: 1px solid #eeeeee;
              }
              .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #777;
                border-radius: 0 0 10px 10px;
                border: 1px solid #eeeeee;
              }
              h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
              }
              h2 {
                color: #FF4D4D;
                font-size: 20px;
              }
              .btn {
                display: inline-block;
                background-color: #FF4D4D;
                color: white;
                text-decoration: none;
                padding: 12px 25px;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
              .warning {
                background-color: #fff8e1;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Hello ${user.firstName || user.username},</h2>
                <p>We received a request to reset your password for your NauMah account. To proceed with the reset, please click the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="btn">Reset Your Password</a>
                </div>
                
                <p>This link will expire in 1 hour for security reasons.</p>
                
                <div class="warning">
                  <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email or contact our support team if you have any concerns.</p>
                </div>
                
                <p>Thank you for using NauMah!</p>
                <p>The NauMah Team</p>
              </div>
              <div class="footer">
                <p>This email was sent to ${user.email}</p>
                <p>&copy; ${new Date().getFullYear()} NauMah. All rights reserved.</p>
                <p>For assistance, contact us at <a href="mailto:${NAUMAH_SUPPORT_EMAIL}">${NAUMAH_SUPPORT_EMAIL}</a></p>
              </div>
            </div>
          </body>
          </html>
        `;
        
        await sendEmail({
          to: user.email,
          from: 'info@sendgrid.net',
          replyTo: NAUMAH_SUPPORT_EMAIL,
          subject,
          html
        });
        
        console.log(`Password reset email sent to ${user.email}`);
      } catch (emailError) {
        // Log error but don't fail the password reset request
        console.error("Error sending password reset email:", emailError);
        console.log(`Password reset link: ${process.env.APP_URL || 'https://naumah.com'}/auth?token=${token}`);
      }

      return res.status(200).json({ message: "Password reset email sent if account exists" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find token in database
      const resetToken = await db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, token),
      });

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Check if token is used
      if (resetToken.isUsed) {
        return res.status(400).json({ message: "Token has already been used" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token has expired" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user's password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "An error occurred during password reset" });
    }
  });

  return { isAuthenticated };
}