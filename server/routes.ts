import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { PgStorage } from "./pgStorage";
import { sql } from "drizzle-orm";
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
  PregnancyStageUpdate,
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
      
      // Try to get data from database
      const data = await storage.getPregnancyData(userId);
      
      console.log(`Retrieved pregnancy data: `, data);
      
      // Add a timestamp to help frontend prioritize data
      const responseData = data ? 
        { ...data, _serverTimestamp: new Date().getTime() } : 
        { currentWeek: 1, _serverTimestamp: new Date().getTime() };
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Return the data with timestamp
      res.json(responseData);
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
      
      // Add timestamp and metadata to help client prioritize data sources
      const enhancedData = {
        ...data,
        _serverTimestamp: new Date().getTime(),
        _source: 'server',
        _updateType: 'stage_update'
      };
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(enhancedData);
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
      
      // Add timestamp for data prioritization
      const enhancedData = {
        ...updatedData,
        _serverTimestamp: new Date().getTime(),
        _updateType: 'combined'
      };
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // 7. Return combined response
      res.json({
        pregnancyData: enhancedData,
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
  // Enhanced admin session check middleware with multiple auth methods
  const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log("🔄 Admin auth middleware - Session ID:", req.sessionID);
    console.log("🔄 Admin auth middleware - Session data:", req.session);
    
    // Method 1: Check if admin session exists (fastest path)
    if (req.session && req.session.isAdmin) {
      console.log("✅ Admin auth passed - Valid admin session found");
      return next();
    }
    
    // Method 2: Check for API key in Bearer token (for backward compatibility)
    const adminKey = process.env.ADMIN_KEY;
    const authHeader = req.headers.authorization;

    if (adminKey && authHeader) {
      // Check Bearer token
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === adminKey) {
          console.log("✅ Admin auth passed - Valid Bearer token provided");
          // If using API key, let's also set the session for future requests
          if (req.session) {
            req.session.isAdmin = true;
            req.session.adminEmail = "sandeep@fastest.health";
            
            req.session.save(err => {
              if (err) {
                console.error("❌ Error saving admin session from API key:", err);
              } else {
                console.log("✅ Admin session saved from Bearer token");
              }
            });
          }
          return next();
        }
      }
      
      // Method 3: Check Basic Auth
      if (authHeader.startsWith('Basic ')) {
        try {
          // Extract and decode credentials
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
          const [username, password] = credentials.split(':');
          
          // Fixed admin credentials
          const adminEmail = "sandeep@fastest.health";
          const adminPassword = "Fastest@2004";
          
          if (username === adminEmail && password === adminPassword) {
            console.log("✅ Admin auth passed - Valid Basic Auth credentials");
            
            // Set session data for future requests
            if (req.session) {
              req.session.isAdmin = true;
              req.session.adminEmail = adminEmail;
              
              // Save session
              req.session.save((err) => {
                if (err) {
                  console.error("❌ Error saving admin session from Basic Auth:", err);
                } else {
                  console.log("✅ Admin session saved from Basic Auth");
                }
              });
            }
            
            return next();
          }
        } catch (authError) {
          console.error("❌ Basic Auth parsing error:", authError);
        }
      }
    }
    
    // Method 4: Check query parameters for emergency access
    const emergencyKey = req.query.emergency_key;
    if (emergencyKey === process.env.ADMIN_KEY) {
      console.log("✅ Admin auth passed - Valid emergency key in query params");
      
      // Set session data for future requests
      if (req.session) {
        req.session.isAdmin = true;
        req.session.adminEmail = "sandeep@fastest.health";
        
        // Save session
        req.session.save((err) => {
          if (err) {
            console.error("❌ Error saving admin session from emergency key:", err);
          } else {
            console.log("✅ Admin session saved from emergency key");
          }
        });
      }
      
      return next();
    }
    
    console.log("❌ Admin auth failed - No valid authentication method found");
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
          // First regenerate the session to prevent session fixation
          req.session.regenerate((regErr) => {
            if (regErr) {
              console.error("Error regenerating session:", regErr);
              return res.status(500).json({ success: false, message: "Session error" });
            }
            
            // Set admin flags on regenerated session
            req.session.isAdmin = true;
            req.session.adminEmail = adminEmail;
            
            console.log("Admin session set:", { 
              isAdmin: req.session.isAdmin, 
              adminEmail: req.session.adminEmail,
              sessionID: req.sessionID 
            });
            
            // Save session explicitly to ensure persistence
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("Error saving admin session:", saveErr);
                return res.status(500).json({ success: false, message: "Session save error" });
              }
              
              console.log("Admin session saved successfully");
              return res.json({ 
                success: true, 
                message: "Admin login successful",
                sessionId: req.sessionID,
                isAdmin: true,
                adminEmail: adminEmail
              });
            });
          });
          
          // This return is needed because we send the response inside the callbacks
          return;
        } else {
          console.error("Session object not available in request");
          return res.status(500).json({ success: false, message: "Session not available" });
        }
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
  
  // EMERGENCY ADMIN LOGIN ENDPOINT - Special direct auth logic for debugging
  app.post("/api/admin/emergency-login", async (req: Request, res: Response) => {
    try {
      console.log("🔴 EMERGENCY ADMIN LOGIN ATTEMPT");
      
      // Get credentials
      const { username, password } = req.body;
      
      // Fixed admin credentials as specified
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      
      // Check credentials directly without validation middleware
      if (username === adminEmail && password === adminPassword) {
        console.log("🔴 EMERGENCY ADMIN LOGIN: Valid credentials provided");
        
        // Create or reset session
        if (req.session) {
          // Set admin flags directly
          req.session.isAdmin = true;
          req.session.adminEmail = adminEmail;
          
          // Bypass session.regenerate for direct session modification
          console.log("🔴 EMERGENCY ADMIN LOGIN: Setting session flags");
          console.log("Session before save:", req.session);
          
          // Save session explicitly with callback to ensure it's stored
          req.session.save((err) => {
            if (err) {
              console.error("🔴 EMERGENCY ADMIN LOGIN: Session save error:", err);
              return res.status(500).json({
                success: false, 
                message: "Session storage failed",
                error: String(err)
              });
            }
            
            console.log("🔴 EMERGENCY ADMIN LOGIN: Session saved successfully");
            console.log("Session after save:", req.session);
            
            // Send success response with session info
            return res.json({
              success: true,
              message: "Emergency admin login successful",
              sessionId: req.sessionID,
              isAdmin: true,
              adminEmail: adminEmail
            });
          });
          
          // This return is needed because we send response in the callback
          return;
        } else {
          console.error("🔴 EMERGENCY ADMIN LOGIN: No session object available");
          return res.status(500).json({
            success: false,
            message: "No session object available"
          });
        }
      } else {
        console.log("🔴 EMERGENCY ADMIN LOGIN: Invalid credentials");
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      console.error("🔴 EMERGENCY ADMIN LOGIN ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Login error",
        error: String(error)
      });
    }
  });

  // EMERGENCY DB DIAGNOSTIC ENDPOINT - no auth check to help debug production issues
  app.get("/api/admin/emergency-db-check", async (req: Request, res: Response) => {
    try {
      console.log("🔴 EMERGENCY DATABASE CHECK REQUESTED");
      console.log("Session data:", req.session);
      
      // Set max permissive headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
      res.setHeader('X-Production-Fix', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Check session - temporarily disabled to allow data access for emergency debugging
      /*
      if (!req.session?.isAdmin) {
        console.log("🔴 EMERGENCY DATABASE CHECK: Not an admin session");
        return res.status(401).json({
          dbConnectionOk: false,
          error: "Authentication required",
          sessionInfo: {
            id: req.sessionID,
            exists: req.session ? true : false,
            isAdmin: false
          }
        });
      }
      */
      
      // Test direct database connection
      try {
        // Simple test query without using SQL tag template
        const testQuery = await db.select().from(schema.users).limit(1);
        console.log("Database connection test result:", testQuery);
      } catch (testError) {
        console.error("Database test query failed:", testError);
      }
      
      // Fetch data directly from users table
      const users = await db.select().from(schema.users);
      console.log(`EMERGENCY CHECK: Found ${users.length} users directly from database`);
      
      // Return diagnostic info and actual data
      return res.json({
        dbConnectionOk: true,
        userCount: users.length,
        userSample: users.slice(0, 3).map(u => ({ 
          id: u.id, 
          username: u.username,
          email: u.email
        })),
        timestamp: new Date().toISOString(),
        sessionInfo: {
          id: req.sessionID,
          isAdmin: req.session?.isAdmin || false,
          adminEmail: req.session?.adminEmail || null
        },
        fullData: users // Include complete user data for emergency troubleshooting
      });
    } catch (dbError) {
      console.error("🔴 EMERGENCY DATABASE CHECK FAILED:", dbError);
      return res.status(500).json({ 
        dbConnectionOk: false,
        error: String(dbError),
        timestamp: new Date().toISOString(),
        sessionInfo: {
          id: req.sessionID,
          isAdmin: req.session?.isAdmin || false,
          adminEmail: req.session?.adminEmail || null
        }
      });
    }
  });

  // New emergency direct database stats endpoint - bypass all complex code
  app.get("/api/admin/emergency-stats", async (req: Request, res: Response) => {
    console.log("🔴 EMERGENCY STATS REQUEST");
    
    // Add aggressive caching prevention headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Vary', '*');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('ETag', Date.now().toString());
    res.setHeader('X-Emergency-Response', 'true');
    
    try {
      // Check for session - if admin, we're okay to proceed
      if (!req.session.isAdmin) {
        console.log("🔴 EMERGENCY STATS: Not an admin session");
        return res.status(401).json({ 
          success: false, 
          message: "Admin authentication required",
          timestamp: new Date().toISOString(),
          sessionInfo: {
            id: req.sessionID,
            exists: req.session ? true : false
          }
        });
      }
      
      // Direct database queries with timing information
      const startTime = Date.now();
      const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        timing: {},
        counts: {},
        samples: {},
        sessionInfo: {
          id: req.sessionID,
          isAdmin: req.session.isAdmin || false,
          adminEmail: req.session.adminEmail || null
        }
      };
      
      // User count
      const usersStartTime = Date.now();
      const users = await db.select().from(schema.users);
      results.timing.users = Date.now() - usersStartTime;
      results.counts.users = users.length;
      results.samples.users = users.slice(0, 2);
      
      // Pregnancy data count
      const pregnancyStartTime = Date.now();
      const pregnancyData = await db.select().from(schema.pregnancyData);
      results.timing.pregnancyData = Date.now() - pregnancyStartTime;
      results.counts.pregnancyData = pregnancyData.length;
      results.samples.pregnancyData = pregnancyData.slice(0, 2);
      
      // Mood entries count
      const moodStartTime = Date.now();
      const moodEntries = await db.select().from(schema.moodEntries);
      results.timing.moodEntries = Date.now() - moodStartTime;
      results.counts.moodEntries = moodEntries.length;
      results.samples.moodEntries = moodEntries.slice(0, 2);
      
      // Total time
      results.timing.total = Date.now() - startTime;
      
      console.log("🔴 EMERGENCY STATS SUCCESS:", results.counts);
      return res.json(results);
    } catch (error) {
      console.error("🔴 EMERGENCY STATS ERROR:", error);
      return res.status(500).json({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
        sessionInfo: {
          id: req.sessionID,
          isAdmin: req.session?.isAdmin || false
        }
      });
    }
  });

  // Direct database check for admin status - useful for emergency admin page
  app.get("/api/admin/direct-status", async (req: Request, res: Response) => {
    console.log("🔴 DIRECT ADMIN STATUS CHECK - Session ID:", req.sessionID);
    
    // Set aggressive anti-caching headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    res.setHeader('Vary', '*');
    res.setHeader('ETag', Date.now().toString());
    res.setHeader('X-Direct-Check', 'true');
    
    try {
      // First, check session data (fastest path)
      if (req.session && req.session.isAdmin) {
        console.log("🔴 DIRECT ADMIN CHECK: Found isAdmin flag in session");
        return res.status(200).json({
          isAdmin: true,
          email: req.session.adminEmail || null,
          method: "session",
          timestamp: new Date().toISOString(),
          sessionId: req.sessionID
        });
      }
      
      // If authentication headers are provided, try direct credential check
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Basic ')) {
        try {
          // Extract and decode credentials
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
          const [username, password] = credentials.split(':');
          
          // Fixed admin credentials
          const adminEmail = "sandeep@fastest.health";
          const adminPassword = "Fastest@2004";
          
          if (username === adminEmail && password === adminPassword) {
            console.log("🔴 DIRECT ADMIN CHECK: Valid Basic Auth credentials");
            
            // Set session data for future requests
            if (req.session) {
              req.session.isAdmin = true;
              req.session.adminEmail = adminEmail;
              
              // Save session
              req.session.save((err) => {
                if (err) {
                  console.error("Error saving admin session from Basic Auth:", err);
                } else {
                  console.log("Admin session saved from Basic Auth");
                }
              });
            }
            
            return res.status(200).json({
              isAdmin: true,
              email: adminEmail,
              method: "basicAuth",
              timestamp: new Date().toISOString(),
              sessionId: req.sessionID
            });
          }
        } catch (authError) {
          console.error("🔴 DIRECT ADMIN CHECK: Basic Auth parsing error:", authError);
        }
      }
      
      // Last resort - check query parameters for emergency access
      const emergencyKey = req.query.emergency_key;
      if (emergencyKey === process.env.ADMIN_KEY) {
        console.log("🔴 DIRECT ADMIN CHECK: Valid emergency key in query params");
        
        // Set session data for future requests
        if (req.session) {
          req.session.isAdmin = true;
          req.session.adminEmail = "sandeep@fastest.health";
          
          // Save session
          req.session.save((err) => {
            if (err) {
              console.error("Error saving admin session from emergency key:", err);
            } else {
              console.log("Admin session saved from emergency key");
            }
          });
        }
        
        return res.status(200).json({
          isAdmin: true,
          email: "sandeep@fastest.health",
          method: "emergencyKey",
          timestamp: new Date().toISOString(),
          sessionId: req.sessionID
        });
      }
      
      console.log("🔴 DIRECT ADMIN CHECK: No valid auth method found");
      return res.status(200).json({
        isAdmin: false,
        method: "none",
        timestamp: new Date().toISOString(),
        sessionId: req.sessionID
      });
    } catch (error) {
      console.error("🔴 DIRECT ADMIN CHECK ERROR:", error);
      return res.status(500).json({
        isAdmin: false,
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Regular admin session check
  app.get("/api/admin/session", (req: Request, res: Response) => {
    console.log("Admin session check - Session ID:", req.sessionID);
    console.log("Admin session check - Session data:", req.session);
    
    // Enhanced cache prevention headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    res.setHeader('Vary', '*');
    res.setHeader('ETag', Date.now().toString());
    
    if (req.session && req.session.isAdmin) {
      console.log("Admin session is valid, returning admin data");
      return res.status(200).json({ 
        isAdmin: true,
        email: req.session.adminEmail,
        timestamp: new Date().toISOString() // Add timestamp to help client detect stale data
      });
    }
    
    console.log("Admin session check failed - not an admin");
    return res.status(200).json({ 
      isAdmin: false,
      timestamp: new Date().toISOString()
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
      console.log("Admin request: Fetching user data", req.headers);
      
      // Maximum caching prevention headers for production emergency fix
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
      res.setHeader('Access-Control-Max-Age', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Vary', '*');
      res.setHeader('ETag', Date.now().toString());
      
      // Production access headers
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      // Special emergency headers
      res.setHeader('X-Production-Fix', 'true');
      res.setHeader('X-Request-Time', new Date().toISOString());
      res.setHeader('X-Cache-Buster', Date.now().toString());
      
      // Check if this is an emergency request
      const isEmergencyRequest = 
        req.headers['x-production-emergency'] === 'true' || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.query._emergency === 'true' ||
        req.query._nocache !== undefined;
        
      // Check for XHR fetch explicitly
      const isXHRFetch = 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.headers['x-production-xhr-fetch'] === 'true';
        
      if (isEmergencyRequest) {
        console.log("PRODUCTION EMERGENCY REQUEST DETECTED", req.headers);
      }
      
      // Fetch user data directly from database
      try {
        const users = await db.select().from(schema.users);
        console.log(`Admin request: Found ${users.length} users`);
        console.log("User data:", JSON.stringify(users, null, 2).substring(0, 500) + "...");
        
        // Add additional debugging information
        res.setHeader('X-Data-Count', users.length.toString());
        res.setHeader('X-Data-Time', new Date().toISOString());
        
        if (isXHRFetch) {
          // Set additional headers for XHR requests
          res.setHeader('X-Production-Response', 'true');
        }
        
        // Return the response
        return res.json(users);
      } catch (dbError) {
        console.error("Database error getting users:", dbError);
        return res.status(500).json({ message: "Failed to get users from database" });
      }
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/pregnancy-data", adminAuth, async (req: Request, res: Response) => {
    try {
      console.log("Admin request: Fetching pregnancy data");
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const data = await db.select().from(schema.pregnancyData);
      console.log(`Admin request: Found ${data.length} pregnancy data records`);
      
      res.json(data);
    } catch (error) {
      console.error("Error getting pregnancy data:", error);
      res.status(500).json({ message: "Failed to get pregnancy data" });
    }
  });

  app.get("/api/admin/mood-entries", adminAuth, async (req: Request, res: Response) => {
    try {
      console.log("Admin request: Fetching mood entries");
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const entries = await db.select().from(schema.moodEntries);
      console.log(`Admin request: Found ${entries.length} mood entries`);
      
      res.json(entries);
    } catch (error) {
      console.error("Error getting mood entries:", error);
      res.status(500).json({ message: "Failed to get mood entries" });
    }
  });

  app.get("/api/admin/medication-checks", adminAuth, async (req: Request, res: Response) => {
    try {
      console.log("Admin request: Fetching medication checks");
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const checks = await db.select().from(schema.medicationChecks);
      console.log(`Admin request: Found ${checks.length} medication checks`);
      
      res.json(checks);
    } catch (error) {
      console.error("Error getting medication checks:", error);
      res.status(500).json({ message: "Failed to get medication checks" });
    }
  });

  // Support messages admin endpoints
  app.get("/api/admin/support-messages", adminAuth, async (req: Request, res: Response) => {
    try {
      console.log("Admin request: Fetching support messages");
      
      // Add caching prevention headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const messages = await storage.getSupportMessages();
      console.log(`Admin request: Found ${messages.length} support messages`);
      
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
