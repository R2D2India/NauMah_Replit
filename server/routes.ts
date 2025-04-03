import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { PgStorage } from "./pgStorage";
import { 
  generateMealPlan, 
  checkMedicationSafety, 
  generateBabyNames, 
  generateChatResponse, 
  generateSpeech, 
  transcribeSpeech 
} from "./openai";
import { pregnancyStageSchema, medicationCheckSchema, moodEntrySchema, waitlistSchema } from "@shared/schema";
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

  // Demo user ID for testing
  const demoUserId = 1;

  // Pregnancy data endpoints
  app.get("/api/pregnancy", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const data = await storage.getPregnancyData(userId);
      if (!data) {
        // Default data for new users
        const defaultData = await storage.updatePregnancyStage(userId, {
          stageType: "week",
          stageValue: "13"
        });
        res.json(defaultData);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error("Error fetching pregnancy data:", error);
      res.status(500).json({ message: "Failed to fetch pregnancy data" });
    }
  });

  app.post("/api/pregnancy/stage", validateRequest(pregnancyStageSchema), async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const data = await storage.updatePregnancyStage(userId, req.validatedData);
      res.json(data);
    } catch (error) {
      console.error("Error updating pregnancy stage:", error);
      res.status(500).json({ message: "Failed to update pregnancy stage" });
    }
  });

  // Mood tracking endpoints
  app.get("/api/mood", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const entries = await storage.getMoodEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/mood", validateRequest(moodEntrySchema), async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
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
      const userId = demoUserId;
      const checks = await storage.getMedicationChecks(userId);
      res.json(checks);
    } catch (error) {
      console.error("Error fetching medication checks:", error);
      res.status(500).json({ message: "Failed to fetch medication checks" });
    }
  });

  // Define schemas 
  const mealPlanSchema = z.object({
    currentWeek: z.number(),
  });
  
  const babyNamesSchema = z.object({
    origin: z.string(),
    gender: z.string()
  });

  const chatSchema = z.object({
    message: z.string().min(1)
  });

  const speechSchema = z.object({
    message: z.string().min(1),
  });
  
  // While this endpoint accepts binary data, we'll add basic validation in the route handler

  // Check medication safety for pregnancy
  app.post("/api/medication/check", validateRequest(medicationCheckSchema), async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
// Weight tracking endpoints
  app.get("/api/weight-tracking", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const weightEntries = await db.select().from(schema.weightTrackingTable);
      res.json(weightEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weight entries" });
    }
  });

  app.post("/api/weight-tracking", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const { weight, date } = req.body;
      const entry = await db.insert(schema.weightTrackingTable).values({
        userId,
        weight,
        date: new Date(date),
      }).returning();
      res.json(entry[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add weight entry" });
    }
  });

  // Symptoms endpoints
  app.get("/api/symptoms", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const symptoms = await db.select().from(schema.symptomsTable);
      res.json(symptoms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symptoms" });
    }
  });

  app.post("/api/symptoms", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const { type, severity, notes, date } = req.body;
      const symptom = await db.insert(schema.symptomsTable).values({
        userId,
        symptom: type,
        severity,
        notes,
        date: new Date(date),
      }).returning();
      res.json(symptom[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to log symptom" });
    }
  });

  // Appointments endpoints
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const appointments = await db.select().from(schema.appointmentsTable);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      const userId = demoUserId;
      const { title, type, location, notes, date } = req.body;
      const appointment = await db.insert(schema.appointmentsTable).values({
        userId,
        title,
        type,
        location,
        notes,
        date: new Date(date),
      }).returning();
      res.json(appointment[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add appointment" });
    }
  });
