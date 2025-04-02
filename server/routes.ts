import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { PgStorage } from "./pgStorage";
import { pregnancyStageSchema, medicationCheckSchema, moodEntrySchema, waitlistSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateChatResponse, generateSpeech, transcribeSpeech } from "./openai";
import z from "zod";

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

  // For demonstration, we'll create a demo user if none exists
  const demoUserId = 1;
  let existingDemoUser = await storage.getUser(demoUserId);
  if (!existingDemoUser) {
    await storage.createUser({
      username: "demo",
      password: "password", // In a real app, this would be hashed
    });
    existingDemoUser = await storage.getUser(demoUserId);
    console.log('Created demo user:', existingDemoUser);
  }

  // Get pregnancy data for a user
  app.get("/api/pregnancy", async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const pregnancyData = await storage.getPregnancyData(userId);
      
      if (!pregnancyData) {
        return res.status(404).json({ message: "No pregnancy data found. Please set up your pregnancy stage." });
      }
      
      res.json(pregnancyData);
    } catch (error) {
      console.error("Error getting pregnancy data:", error);
      res.status(500).json({ message: "Failed to get pregnancy data" });
    }
  });

  // Update pregnancy stage for a user
  app.post("/api/pregnancy/stage", validateRequest(pregnancyStageSchema), async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const { stageType, stageValue } = req.validatedData;
      
      const updatedData = await storage.updatePregnancyStage(userId, { stageType, stageValue });
      
      res.json(updatedData);
    } catch (error) {
      console.error("Error updating pregnancy stage:", error);
      res.status(500).json({ message: "Failed to update pregnancy stage" });
    }
  });

  // Get mood entries for a user
  app.get("/api/mood", async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const entries = await storage.getMoodEntries(userId);
      
      res.json(entries);
    } catch (error) {
      console.error("Error getting mood entries:", error);
      res.status(500).json({ message: "Failed to get mood entries" });
    }
  });

  // Create a new mood entry
  app.post("/api/mood", validateRequest(moodEntrySchema), async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const { mood, note } = req.validatedData;
      
      // Get current pregnancy data to determine week
      const pregnancyData = await storage.getPregnancyData(userId);
      if (!pregnancyData) {
        return res.status(400).json({ message: "Please set up your pregnancy stage first" });
      }
      
      const entry = await storage.createMoodEntry({
        userId,
        week: pregnancyData.currentWeek,
        mood,
        note: note || "",
      });
      
      res.json(entry);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      res.status(500).json({ message: "Failed to create mood entry" });
    }
  });

  // Get medication checks for a user
  app.get("/api/medication", async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const checks = await storage.getMedicationChecks(userId);
      
      res.json(checks);
    } catch (error) {
      console.error("Error getting medication checks:", error);
      res.status(500).json({ message: "Failed to get medication checks" });
    }
  });

  // Check medication safety for pregnancy
  app.post("/api/medication/check", validateRequest(medicationCheckSchema), async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from the authenticated session
      const userId = demoUserId;
      const { medicationName } = req.validatedData;
      
      // In a real app, this would call a medical API to check safety
      // For now, we'll use a simple simulation
      const medications = {
        "acetaminophen": { isSafe: true, notes: "Generally considered safe during pregnancy when used as directed." },
        "ibuprofen": { isSafe: false, notes: "Not recommended during pregnancy, especially in the third trimester." },
        "prenatal vitamins": { isSafe: true, notes: "Recommended during pregnancy to support maternal and fetal health." },
      };
      
      const lowercaseMedName = medicationName.toLowerCase();
      let isSafe: boolean | null = null;
      let notes = "Information not available. Please consult your healthcare provider.";
      
      if (lowercaseMedName in medications) {
        isSafe = medications[lowercaseMedName as keyof typeof medications].isSafe;
        notes = medications[lowercaseMedName as keyof typeof medications].notes;
      }
      
      const check = await storage.createMedicationCheck({
        userId,
        medicationName,
        isSafe,
        notes,
      });
      
      res.json(check);
    } catch (error) {
      console.error("Error checking medication:", error);
      res.status(500).json({ message: "Failed to check medication" });
    }
  });
  
  // Chat with AI Assistant
  const chatSchema = z.object({
    message: z.string().min(1)
  });
  
  app.post("/api/chat", validateRequest(chatSchema), async (req: Request, res: Response) => {
    try {
      const { message, pregnancyWeek } = req.validatedData;
      
      // Create base context for the AI
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant. Keep responses under 100 words. Structure your responses in short, clear bullet points. Be compassionate and evidence-based. Start with a brief greeting when appropriate. Always recommend consulting healthcare providers for medical advice.";
      
      const response = await generateChatResponse(message, context);
      res.json({ response });
    } catch (error) {
      console.error("Error generating chat response:", error);
      res.status(500).json({ message: "Failed to generate chat response" });
    }
  });
  
  // Generate text-to-speech from AI response
  const speechSchema = z.object({
    message: z.string().min(1),
  });

  app.post("/api/voice/speech", validateRequest(speechSchema), async (req: Request, res: Response) => {
    try {
      const { message } = req.validatedData;
      
      // Create base context for voice responses
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant providing guidance to expecting mothers. Your responses should be compassionate, evidence-based, and medically sound, but always recommend consulting healthcare providers for personal medical advice. Keep responses concise (under 100 words) for voice output.";
      
      // First generate text response
      const textResponse = await generateChatResponse(message, context);
      
      try {
        // Convert to speech
        const audioBuffer = await generateSpeech(textResponse);
        
        // Send audio file
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
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
      return res.status(500).json({ message: "Failed to process your request" });
    }
  });

  const httpServer = createServer(app);
  // Waitlist endpoint
  app.post("/api/waitlist", validateRequest(waitlistSchema), async (req: Request, res: Response) => {
    try {
      const entry = await storage.createWaitlistEntry(req.validatedData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating waitlist entry:", error);
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });

  // Admin routes
  const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = process.env.ADMIN_KEY;
    const authHeader = req.headers.authorization;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

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

  return httpServer;
}
