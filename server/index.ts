import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db";
import { setupAuth } from "./auth";
import fs from "fs";
import path from "path";

// Check and log critical environment variables for deployment diagnostics
const criticalVars = ['OPENAI_API_KEY', 'DATABASE_URL', 'SESSION_SECRET'];
const missingVars = criticalVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️ DEPLOYMENT WARNING: Missing critical environment variables: ${missingVars.join(', ')}`);
  console.log('Environment variables available:', Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD'))
    .join(', '));
} else {
  console.log('✅ All critical environment variables are available');
}

// Add session types
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    userId?: number; // Add userId to store unique user identifier
    adminEmail?: string; // Admin email for session
    passport?: {
      user: number; // User ID for authenticated users
    };
  }
}

// Extend Express Request type to include user property from Passport
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      // Other user properties
    }
  }
}

const app = express();
app.use(express.json({ limit: '16mb' })); // Increase payload limit for audio content
app.use(express.urlencoded({ extended: false }));

// Setup authentication (must be done before routes)
setupAuth(app);

// Add type for isAuthenticated
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
    }
  }
}

// Non-authenticated sessions get anonymous user ID
app.use((req, res, next) => {
  if ((!req.isAuthenticated || !req.isAuthenticated()) && !req.session.userId) {
    // Generate a unique user ID for this session that's compatible with PostgreSQL integer type
    // PostgreSQL integers have a range of -2147483648 to +2147483647
    // We'll use a smaller random number to ensure compatibility
    const userId = Math.floor(Math.random() * 1000000) + 1; // Random number between 1 and 1,000,000
    req.session.userId = userId;
    console.log(`Created new anonymous session with ID: ${req.session.userId}`);
  }
  next();
});

// Add CORS headers for deployed environments
app.use((req, res, next) => {
  // In development, use the HTTP Origin header from the request
  // This header is set by the browser and contains the origin of the request
  const origin = req.headers.origin;
  
  // Important: When using credentials, we must specify an exact origin
  // We cannot use wildcard '*' with credentials
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Run database migrations before starting the server
    log('Running database migrations...');
    await runMigrations();
    log('Migrations completed successfully');

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
      backlog: 100
    }, () => {
      log(`Server running at http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();