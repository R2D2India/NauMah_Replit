import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db";

// Add session types
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    userId?: number; // Add userId to store unique user identifier
  }
}

const app = express();
app.use(express.json({ limit: '16mb' })); // Increase payload limit for audio content
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'naumah-admin-secret-key',
  resave: false,
  saveUninitialized: true, // Changed to true to save session for new users
  cookie: {
    secure: false, // Set to false in development for localhost testing
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests
  }
}));

// User session middleware - assigns a unique user ID to each session
app.use((req, res, next) => {
  if (!req.session.userId) {
    // Generate a unique user ID for this session that's compatible with PostgreSQL integer type
    // PostgreSQL integers have a range of -2147483648 to +2147483647
    // We'll use a smaller random number to ensure compatibility
    const userId = Math.floor(Math.random() * 1000000) + 1; // Random number between 1 and 1,000,000
    req.session.userId = userId;
    console.log(`Created new user session with ID: ${req.session.userId}`);
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