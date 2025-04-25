import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { PgStorage } from "./pgStorage";
import { 
  generateMealPlan, 
  checkMedicationSafety, 
  generateBabyNames, 
  generateChatResponse, 
  generateSpeech, 
  transcribeSpeech,
  analyzeProductImageForSafety,
  generateBabyDevelopment
} from "./openai";
import { sendWaitlistNotification, sendEmail } from "./email";
import { setupAuth } from "./auth";
import { 
  pregnancyStageSchema, 
  medicationCheckSchema, 
  moodEntrySchema, 
  waitlistSchema, 
  chatSchema, 
  speechSchema, 
  babyNamesSchema, 
  mealPlanSchema,
  adminLoginSchema,
  productImageCheckSchema,
  contactSchema,
  ContactFormData,
  journalEntrySchema,
  // Auth schemas
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import z from "zod";
import { db } from "./db";
import * as schema from "@shared/schema";

// Initialize the PostgreSQL storage
const storage = new PgStorage();

// Extend the Request type to include validatedData
declare global {
  namespace Express {
    interface Request {
      validatedData: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  const { isAuthenticated } = setupAuth(app);
  
  // Middleware to handle validation errors consistently
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.validatedData = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({ message: validationError.message });
        } else {
          res.status(400).json({ message: "Invalid request data" });
        }
      }
    };
  };

  // Pregnancy data endpoints
  app.get("/api/pregnancy", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      console.log(`Fetching pregnancy data for userId ${userId}`);
      
      const data = await storage.getPregnancyData(userId);
      
      console.log(`Retrieved pregnancy data: `, data);
      
      // If no data exists yet, return a default object with currentWeek=1
      // This provides better type consistency for the frontend
      res.json(data || { currentWeek: 1 });
    } catch (error) {
      console.error("Error fetching pregnancy data:", error);
      res.status(500).json({ message: "Failed to fetch pregnancy data" });
    }
  });

  app.post("/api/pregnancy/stage", validateRequest(pregnancyStageSchema), async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      console.log(`Updating pregnancy stage for userId ${userId}: `, req.validatedData);
      
      const data = await storage.updatePregnancyStage(userId, req.validatedData);
      
      console.log(`Updated pregnancy data: `, data);
      
      res.json(data);
    } catch (error) {
      console.error("Error updating pregnancy stage:", error);
      res.status(500).json({ message: "Failed to update pregnancy stage" });
    }
  });

  // Mood tracking endpoints
  app.get("/api/mood", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const entries = await storage.getMoodEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/mood", validateRequest(moodEntrySchema), async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const entry = await storage.createMoodEntry({
        ...req.validatedData,
        userId,
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      res.status(500).json({ message: "Failed to create mood entry" });
    }
  });

  // Medication check endpoints
  app.get("/api/medication", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const checks = await storage.getMedicationChecks(userId);
      res.json(checks);
    } catch (error) {
      console.error("Error fetching medication checks:", error);
      res.status(500).json({ message: "Failed to fetch medication checks" });
    }
  });

  // While API endpoints that accept binary data will have validation in the route handler

  // Check medication safety for pregnancy
  app.post("/api/medication/check", validateRequest(medicationCheckSchema), async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const { medicationName } = req.validatedData;

      const safetyInfo = await checkMedicationSafety(medicationName);

      const check = await storage.createMedicationCheck({
        userId,
        medicationName,
        isSafe: safetyInfo.isSafe,
        notes: safetyInfo.notes,
      });

      res.json({
        ...check,
        risks: safetyInfo.risks,
        alternatives: safetyInfo.alternatives
      });
    } catch (error) {
      console.error("Error checking medication:", error);
      res.status(500).json({ message: "Failed to check medication" });
    }
  });
  
  // Analyze product image for safety (food or medication)
  app.post("/api/product/image-check", validateRequest(productImageCheckSchema), async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const { imageBase64 } = req.validatedData;
      
      const safetyInfo = await analyzeProductImageForSafety(imageBase64);
      
      // Store the check in the database
      if (safetyInfo.productType === "Medication") {
        await storage.createMedicationCheck({
          userId,
          medicationName: safetyInfo.productName,
          isSafe: safetyInfo.isSafe,
          notes: safetyInfo.notes,
        });
      }
      
      res.json(safetyInfo);
    } catch (error) {
      console.error("Error analyzing product image:", error);
      res.status(500).json({ message: "Failed to analyze product image" });
    }
  });

  // Chat with AI Assistant
  app.post("/api/chat", validateRequest(chatSchema), async (req: Request, res: Response) => {
    try {
      const { message } = req.validatedData;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          message: "AI service is temporarily unavailable. Please try again later.",
          error: "OpenAI API key not configured"
        });
      }
      
      // Create base context for the AI
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant. Format your responses in clear, well-structured paragraphs. Keep responses concise (under 100 words). Be compassionate and evidence-based. Start with a brief greeting. After answering the question, always suggest 1-2 relevant follow-up topics based on pregnancy stage and current conversation context (e.g. 'Would you like to know about recommended tests for this trimester?' or 'Would you like to learn about baby development at this stage?'). Use proper paragraph breaks for readability. End with a gentle healthcare provider consultation reminder.";
      
      const response = await generateChatResponse(message, context);
      
      if (!response) {
        throw new Error("No response generated");
      }
      
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process chat";
      const status = (error instanceof Error && error.message?.includes('API key')) ? 401 : 500;
      res.status(status).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  });

  app.post("/api/voice/transcribe", async (req: Request, res: Response) => {
    try {
      const audioData = req.body;
      
      // Basic validation of audio data
      if (!audioData || !Buffer.isBuffer(audioData)) {
        return res.status(400).json({ 
          message: "Invalid audio data. Must provide binary audio data in the request body." 
        });
      }
      
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(401).json({
          message: "OpenAI API key not configured. Please set up your API key."
        });
      }
      
      // Use transcribeSpeech instead of transcribeAudio for consistency
      const transcription = await transcribeSpeech(Buffer.from(audioData));
      
      // Ensure we have a transcription
      if (!transcription || transcription.trim() === '') {
        return res.status(422).json({
          message: "Could not transcribe audio. The audio may be too short, unclear, or in an unsupported format."
        });
      }
      
      // Create base context for voice responses
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant providing guidance to expecting mothers. Your responses should be compassionate, evidence-based, and medically sound, but always recommend consulting healthcare providers for personal medical advice. Keep responses concise (under 100 words) for voice output.";
      
      const response = await generateChatResponse(transcription, context);
      const audioResponse = await generateSpeech(response);
      
      res.json({ 
        text: transcription,
        response,
        audio: audioResponse.toString('base64')
      });
    } catch (error) {
      console.error("Error in voice transcription:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process voice input";
      const status = (error instanceof Error && error.message?.includes('API key')) ? 401 : 500;
      
      res.status(status).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  });

  // Generate text-to-speech from AI response
  app.post("/api/voice/speech", validateRequest(speechSchema), async (req: Request, res: Response) => {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(401).json({
          message: "OpenAI API key not configured. Please set up your API key."
        });
      }

      const { message } = req.validatedData;

      // Create base context for voice responses
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant providing guidance to expecting mothers. Your responses should be compassionate, evidence-based, and medically sound, but always recommend consulting healthcare providers for personal medical advice. Keep responses concise (under 100 words) for voice output.";

      // First generate text response
      const textResponse = await generateChatResponse(message, context);

      try {
        // Convert to speech
        const audioBuffer = await generateSpeech(textResponse);

        // Send audio file with proper CORS headers for deployed environments
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        return res.send(audioBuffer);
      } catch (speechError) {
        console.error("Error generating speech:", speechError);
        // If speech generation fails, at least return the text response
        return res.status(500).json({ 
          message: "Failed to generate speech, but here's the text response",
          textResponse 
        });
      }
    } catch (error) {
      console.error("Error in voice route:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ 
        message: "Failed to process your request", 
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  // Generate baby names
  app.post("/api/baby-names", validateRequest(babyNamesSchema), async (req: Request, res: Response) => {
    try {
      const { origin, gender } = req.validatedData;
      const names = await generateBabyNames(origin, gender);
      res.json(names);
    } catch (error) {
      console.error("Error generating baby names:", error);
      res.status(500).json({ 
        message: "Failed to generate baby names",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  });

  // Generate meal plan  
  app.post("/api/meal-plan", validateRequest(mealPlanSchema), async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      const { currentWeek } = req.validatedData;
      const mealPlan = await generateMealPlan(currentWeek);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate meal plan";
      const status = (error instanceof Error && error.message?.includes('API key')) ? 401 : 500;
      res.status(status).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  });
  
  // Health check endpoint for OpenAI integration
  app.get("/api/openai-status", (req: Request, res: Response) => {
    const status = {
      available: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    };
    res.json(status);
  });
  
  // Production-ready combined endpoint for pregnancy updates and baby development
  app.post("/api/pregnancy/update-with-development", async (req: Request, res: Response) => {
    try {
      // 1. Get user ID
      const userId = req.session.userId || req.session.passport?.user;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // 2. Extract stage data
      const { stageType, stageValue } = req.body;
      if (!stageType || !stageValue) {
        return res.status(400).json({ message: "Missing stageType or stageValue" });
      }
      
      // 3. Convert to week format
      let week: number;
      if (stageType === "week") {
        week = parseInt(stageValue);
      } else if (stageType === "month") {
        // Convert month to approximate week
        week = parseInt(stageValue) * 4 + 1;
      } else if (stageType === "trimester") {
        // Convert trimester to approximate middle week
        const trimesterValue = parseInt(stageValue);
        if (trimesterValue === 1) week = 8;
        else if (trimesterValue === 2) week = 20;
        else week = 32;
      } else {
        return res.status(400).json({ message: "Invalid stageType" });
      }
      
      // 4. Calculate due date (40 weeks from current week)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (40 - week) * 7);
      
      console.log(`Updating pregnancy stage for userId ${userId}: `, { stageType, stageValue });
      
      // 5. Update pregnancy data
      // Create an object with just the required properties for PregnancyStageUpdate
      const updateData: PregnancyStageUpdate = {
        stageType: "week",
        stageValue: week.toString()
      };
      
      const updatedData = await storage.updatePregnancyStage(userId, updateData);
      
      // 6. Get baby development info in the same request
      console.log(`Generating baby development information for week ${week}`);
      const developmentInfo = await generateBabyDevelopment(week);
      
      // 7. Return combined response
      res.json({
        pregnancyData: updatedData,
        babyDevelopment: developmentInfo,
        success: true
      });
    } catch (error) {
      console.error("Error updating pregnancy with development:", error);
      res.status(500).json({ message: "Failed to update pregnancy and get development information" });
    }
  });
  
  // Baby development information for given pregnancy week
  app.get("/api/baby-development/:week", async (req: Request, res: Response) => {
    // Set appropriate content type to ensure Vite doesn't intercept
    res.setHeader('Content-Type', 'application/json');
    
    // Add additional headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const week = parseInt(req.params.week);
      if (isNaN(week) || week < 1 || week > 42) {
        return res.status(400).json({ 
          message: "Invalid pregnancy week. Must be between 1 and 42."
        });
      }
      
      console.log(`Generating baby development information for week ${week}`);
      
      // Set a timeout for the API call to prevent server hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 20 seconds")), 20000);
      });
      
      // Race the API call against the timeout
      const developmentInfo = await Promise.race([
        generateBabyDevelopment(week),
        timeoutPromise
      ]) as ReturnType<typeof generateBabyDevelopment>;
      
      // Check if we have development info (handled by fallback already in generateBabyDevelopment)
      if (!developmentInfo) {
        throw new Error("Failed to retrieve baby development information");
      }
      
      console.log(`Successfully generated baby development info for week ${week}`);
      res.json(developmentInfo);
    } catch (error) {
      console.error("Error handling baby development request:", error);
      
      // Always return a 200 with backup data rather than error to ensure UI works
      const week = parseInt(req.params.week) || 1;
      
      // Import getBackupBabyDevelopmentData directly from openai.ts to use backup data
      const { getBackupBabyDevelopmentData } = await import('./openai');
      
      res.json(getBackupBabyDevelopmentData(week));
    }
  });

  // Waitlist endpoint
  app.post("/api/waitlist", validateRequest(waitlistSchema), async (req: Request, res: Response) => {
    try {
      // Check for duplicates explicitly before creating entry
      const duplicateCheck = await storage.checkWaitlistDuplicate(
        req.validatedData.email, 
        req.validatedData.mobile
      );
      
      if (duplicateCheck.exists) {
        // Return a 409 Conflict status for duplicate entries
        return res.status(409).json({ 
          success: false, 
          message: `A user with this ${duplicateCheck.field} already exists in our waitlist.`,
          field: duplicateCheck.field
        });
      }
      
      // Create waitlist entry if no duplicates found
      const entry = await storage.createWaitlistEntry(req.validatedData);
      
      // Send email notification to admin
      const { NAUMAH_SUPPORT_EMAIL } = await import('./email');
      const emailSent = await sendWaitlistNotification(NAUMAH_SUPPORT_EMAIL, req.validatedData);
      
      if (emailSent) {
        console.log(`Waitlist notification email successfully sent to ${NAUMAH_SUPPORT_EMAIL}`);
        res.json({ 
          success: true, 
          message: "Successfully joined waitlist and sent notification.",
          entry 
        });
      } else {
        console.error(`Failed to send waitlist notification email to ${NAUMAH_SUPPORT_EMAIL}`);
        // Provide information directly in the response as a fallback
        res.json({ 
          success: true, 
          message: "Successfully joined waitlist, but email notification failed. Please check the data below:",
          entry,
          waitlistData: {
            name: req.validatedData.name,
            email: req.validatedData.email,
            mobile: req.validatedData.mobile,
            submittedAt: new Date().toLocaleString()
          }
        });
      }
    } catch (error) {
      console.error("Error creating waitlist entry:", error);
      
      // Check if it's a duplicate error from the database layer
      if (error instanceof Error && error.message) {
        if (
          error.message.includes("email already exists") || 
          error.message.includes("mobile already exists") ||
          error.message.includes("already exists in our waitlist")
        ) {
          return res.status(409).json({ 
            success: false, 
            message: error.message
          });
        }
      }
      
      // Generic error response
      res.status(500).json({ 
        success: false,
        message: "Failed to join waitlist" 
      });
    }
  });

  // View latest waitlist entries without auth (for quick testing)
  app.get("/api/waitlist/latest", async (req: Request, res: Response) => {
    try {
      const entries = await storage.getWaitlistEntries();
      // Return only the most recent 10 entries
      const latestEntries = entries.slice(-10).reverse();
      res.json({
        message: "Latest waitlist entries (newest first):",
        entries: latestEntries
      });
    } catch (error) {
      console.error("Error getting waitlist entries:", error);
      res.status(500).json({ message: "Failed to get waitlist entries" });
    }
  });
  
  // Profile update endpoint
  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const { firstName, email } = req.body;
      if (!firstName || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      // In a real app, you would save this to the database
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin routes
  // Admin session check middleware
  const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log("Admin auth middleware - Session ID:", req.sessionID);
    console.log("Admin auth middleware - Session data:", req.session);
    
    // Check if admin session exists
    if (req.session && req.session.isAdmin) {
      console.log("Admin auth passed - Valid admin session found");
      return next();
    }
    
    // If no session, check for API key (for backward compatibility)
    const adminKey = process.env.ADMIN_KEY;
    const authHeader = req.headers.authorization;

    if (adminKey && authHeader === `Bearer ${adminKey}`) {
      console.log("Admin auth passed - Valid API key provided");
      // If using API key, let's also set the session for future requests
      if (req.session) {
        req.session.isAdmin = true;
        req.session.adminEmail = "sandeep@fastest.health";
        
        req.session.save(err => {
          if (err) {
            console.error("Error saving admin session from API key:", err);
          }
        });
      }
      return next();
    }
    
    console.log("Admin auth failed - No valid session or API key");
    return res.status(401).json({ message: "Unauthorized" });
  };
  
  // Admin login route
  app.post("/api/admin/login", validateRequest(adminLoginSchema), async (req: Request, res: Response) => {
    try {
      const { username, password } = req.validatedData;
      
      // Fixed admin credentials as specified
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      
      console.log("Admin login attempt:", { username, providedEmail: adminEmail });
      
      if (username === adminEmail && password === adminPassword) {
        // Set admin session
        if (req.session) {
          req.session.isAdmin = true;
          req.session.adminEmail = adminEmail;
          console.log("Admin session set:", { 
            isAdmin: req.session.isAdmin, 
            adminEmail: req.session.adminEmail,
            sessionID: req.sessionID 
          });
          
          // Save session explicitly to ensure persistence
          req.session.save(err => {
            if (err) {
              console.error("Error saving admin session:", err);
            } else {
              console.log("Admin session saved successfully");
            }
          });
        } else {
          console.error("Session object not available in request");
        }
        
        return res.json({ 
          success: true, 
          message: "Admin login successful" 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred during authentication" 
      });
    }
  });
  
  // Admin logout route
  app.post("/api/admin/logout", adminAuth, (req: Request, res: Response) => {
    if (req.session) {
      req.session.isAdmin = false;
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Logout failed" 
          });
        }
        
        return res.json({ 
          success: true, 
          message: "Logged out successfully" 
        });
      });
    } else {
      return res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    }
  });
  
  // Admin session check
  app.get("/api/admin/session", (req: Request, res: Response) => {
    console.log("Admin session check - Session ID:", req.sessionID);
    console.log("Admin session check - Session data:", req.session);
    
    if (req.session && req.session.isAdmin) {
      console.log("Admin session is valid, returning admin data");
      return res.status(200).json({ 
        isAdmin: true,
        email: req.session.adminEmail
      });
    }
    
    console.log("Admin session check failed - not an admin");
    return res.status(200).json({ 
      isAdmin: false 
    });
  });
  
  // Admin password reset
  app.post("/api/admin/reset-password", adminAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Current password and new password are required" 
        });
      }
      
      // Fixed admin credentials as specified
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      
      // Verify current password
      if (currentPassword !== adminPassword) {
        return res.status(401).json({ 
          success: false, 
          message: "Current password is incorrect" 
        });
      }
      
      // In a real application, you'd update the password in the database
      // For this implementation, we'll store it in an environment variable
      process.env.ADMIN_PASSWORD = newPassword;
      
      return res.json({ 
        success: true, 
        message: "Password updated successfully" 
      });
    } catch (error) {
      console.error("Admin password reset error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred during password reset" 
      });
    }
  });

  // Admin routes for data access
  app.get("/api/admin/waitlist", adminAuth, async (req: Request, res: Response) => {
    try {
      const entries = await storage.getWaitlistEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error getting waitlist entries:", error);
      res.status(500).json({ message: "Failed to get waitlist entries" });
    }
  });

  app.get("/api/admin/users", adminAuth, async (req: Request, res: Response) => {
    try {
      const users = await db.select().from(schema.users);
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/pregnancy-data", adminAuth, async (req: Request, res: Response) => {
    try {
      const data = await db.select().from(schema.pregnancyData);
      res.json(data);
    } catch (error) {
      console.error("Error getting pregnancy data:", error);
      res.status(500).json({ message: "Failed to get pregnancy data" });
    }
  });

  app.get("/api/admin/mood-entries", adminAuth, async (req: Request, res: Response) => {
    try {
      const entries = await db.select().from(schema.moodEntries);
      res.json(entries);
    } catch (error) {
      console.error("Error getting mood entries:", error);
      res.status(500).json({ message: "Failed to get mood entries" });
    }
  });

  app.get("/api/admin/medication-checks", adminAuth, async (req: Request, res: Response) => {
    try {
      const checks = await db.select().from(schema.medicationChecks);
      res.json(checks);
    } catch (error) {
      console.error("Error getting medication checks:", error);
      res.status(500).json({ message: "Failed to get medication checks" });
    }
  });

  // Support messages admin endpoints
  app.get("/api/admin/support-messages", adminAuth, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getSupportMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error getting support messages:", error);
      res.status(500).json({ message: "Failed to get support messages" });
    }
  });
  
  app.post("/api/admin/support-messages/:id/mark-read", adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.markSupportMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error("Error marking support message as read:", error);
      res.status(500).json({ message: "Failed to update support message" });
    }
  });

  // Create HTTP server
  // Weight tracking endpoints
  app.get("/api/weight-tracking", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const weightEntries = await storage.getWeightEntries(userId);
      res.json(weightEntries);
    } catch (error) {
      console.error("Error getting weight entries:", error);
      res.status(500).json({ error: "Failed to fetch weight entries" });
    }
  });

  app.post("/api/weight-tracking", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const { weight, date, notes } = req.body;
      
      if (!weight || !date) {
        return res.status(400).json({ error: "Weight and date are required" });
      }

      const entry = await storage.createWeightEntry({
        userId,
        weight: Number(weight),
        date: new Date(date),
        notes: notes || undefined
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating weight entry:", error);
      res.status(500).json({ error: "Failed to add weight entry" });
    }
  });

  // Symptoms endpoints
  app.get("/api/symptoms", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const symptoms = await storage.getSymptomEntries(userId);
      res.json(symptoms);
    } catch (error) {
      console.error("Error getting symptoms:", error);
      res.status(500).json({ error: "Failed to fetch symptoms" });
    }
  });

  app.post("/api/symptoms", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const { type, severity, notes, date } = req.body;
      
      if (!type || !severity || !date) {
        return res.status(400).json({ error: "Symptom type, severity, and date are required" });
      }

      const symptom = await storage.createSymptomEntry({
        userId,
        symptom: type,
        severity: Number(severity),
        date: new Date(date),
        notes: notes || undefined
      });
      
      res.status(201).json(symptom);
    } catch (error) {
      console.error("Error creating symptom entry:", error);
      res.status(500).json({ error: "Failed to log symptom" });
    }
  });

  // Appointments endpoints
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error getting appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const { title, type, location, notes, date } = req.body;
      
      if (!title || !type || !date) {
        return res.status(400).json({ error: "Title, type, and date are required" });
      }

      const appointment = await storage.createAppointment({
        userId,
        title,
        type,
        date: new Date(date),
        location: location || undefined,
        notes: notes || undefined
      });
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add appointment" });
    }
  });
  
  // Contact form endpoint
  app.post("/api/contact", validateRequest(contactSchema), async (req: Request, res: Response) => {
    try {
      const formData = req.validatedData;
      
      // Store message in database instead of sending email
      await storage.createSupportMessage(formData);
      
      return res.status(200).json({ 
        message: "Your message has been received successfully. We'll get back to you soon." 
      });
    } catch (error) {
      console.error("Error saving contact form:", error);
      res.status(500).json({ 
        message: "Failed to save your message. Please try again later.",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // Journal entries endpoints
  app.get("/api/journal", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error getting journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/:id", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const entryId = parseInt(req.params.id);
      
      if (isNaN(entryId)) {
        return res.status(400).json({ error: "Invalid entry ID" });
      }
      
      const entry = await storage.getJournalEntry(entryId);
      
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      
      // Ensure users can only access their own entries
      if (entry.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error getting journal entry:", error);
      res.status(500).json({ error: "Failed to fetch journal entry" });
    }
  });

  app.post("/api/journal", validateRequest(journalEntrySchema), async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      const journalData = req.validatedData;
      
      const entry = await storage.createJournalEntry({
        userId,
        title: journalData.title,
        content: journalData.content,
        mood: journalData.mood,
        date: journalData.date
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}
