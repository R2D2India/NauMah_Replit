import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { createHash } from "crypto";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash password using scrypt and a random salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare a supplied password with a stored hashed password
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate a random token for password reset
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  // Configure session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "naumah-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    store: new PostgresSessionStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
  };

  // Use proxied headers from frontend server
  app.set("trust proxy", 1);
  
  // Initialize session middleware
  app.use(session(sessionSettings));
  
  // Initialize passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure the local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find the user by username
        const user = await storage.getUserByUsername(username);
        
        // If no user found or password doesn't match, authentication fails
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Authentication successful, return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize user to store in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Register a new user
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);

      // Create the user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log the user in automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Return the user without sensitive data
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Return the user without sensitive data
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Forgot password - send reset token
  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal that the user doesn't exist
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Generate reset token
      const token = generateToken();
      
      // Set token expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Save token to database
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        isUsed: false,
      });
      
      // In a real application, send an email with the reset link
      // For simplicity, we'll just return the token in the response
      // In production, use sendEmail function to send a proper email with reset link
      
      // Return success message
      res.status(200).json({
        message: "If your email is registered, you will receive a password reset link",
        // Remove this line in production and send the token via email
        token
      });
    } catch (error) {
      next(error);
    }
  });

  // Reset password using token
  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      // Find valid token
      const resetToken = await storage.getValidPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(password);
      
      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);
      
      // Return success message
      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  });

  // Update user profile (authenticated users only)
  app.put("/api/auth/profile", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      
      // Get fields to update (exclude sensitive fields)
      const { firstName, lastName, profilePicture } = req.body;
      
      // Update user profile
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        profilePicture,
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Change password (authenticated users only)
  app.post("/api/auth/change-password", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Return success message
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });

  return { isAuthenticated };
}