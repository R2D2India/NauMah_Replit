import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { PgStorage } from "./pgStorage";
import { generateMealPlan, checkMedicationSafety, generateBabyNames } from "./openai";
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
  const chatSchema = z.object({
    message: z.string().min(1)
  });
  
  app.post("/api/chat", validateRequest(chatSchema), async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      const { message } = req.validatedData;
      const response = await getAssistantResponse(message);
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        message: "Failed to process chat",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
});

app.post("/api/voice/transcribe", async (req: Request, res: Response) => {
    try {
      const audioData = req.body;
      const transcription = await transcribeAudio(Buffer.from(audioData));
      const response = await getAssistantResponse(transcription);
      const audioResponse = await generateSpeech(response);
      res.json({ 
        text: transcription,
        response,
        audio: audioResponse.toString('base64')
      });
    } catch (error) {
      console.error("Error in voice transcription:", error);
      res.status(500).json({ 
        message: "Failed to process voice input",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
});

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

app.post("/api/meal-plan", validateRequest(mealPlanSchema), async (req: Request, res: Response) => {
    try {
      const { currentWeek } = req.validatedData;
      const mealPlan = await generateMealPlan(currentWeek);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ 
        message: "Failed to generate meal plan",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
});

      const { message } = req.validatedData;
      
      // Create base context for the AI
      const context = "You are NauMah, a knowledgeable and supportive AI pregnancy assistant. Format your responses in clear, well-structured paragraphs. Keep responses concise (under 100 words). Be compassionate and evidence-based. Start with a brief greeting. After answering the question, always suggest 1-2 relevant follow-up topics based on pregnancy stage and current conversation context (e.g. 'Would you like to know about recommended tests for this trimester?' or 'Would you like to learn about baby development at this stage?'). Use proper paragraph breaks for readability. End with a gentle healthcare provider consultation reminder.";
      
      const response = await generateChatResponse(message, context);
      
      if (!response) {
        throw new Error("No response generated");
      }
      
      res.json({ response });
    } catch (error) {
      console.error("Error generating chat response:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate chat response";
      const status = error.message?.includes('API key') ? 401 : 500;
      res.status(status).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
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

app.get("/api/admin/users", adminAuth, async (req: Request, res: Response) => {
    try {
      const users = await db.select().from(schema.users);
      res.json(users);


  // Generate meal plan
  const mealPlanSchema = z.object({
    currentWeek: z.number(),
  });

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
      const status = error.message?.includes('API key') ? 401 : 500;
      res.status(status).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  });


    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }

  // Generate baby names
  const babyNamesSchema = z.object({
    origin: z.string(),
    gender: z.string()
  });

  app.post("/api/baby-names", validateRequest(babyNamesSchema), async (req: Request, res: Response) => {
    try {
      const { origin, gender } = req.validatedData;
      const names = await generateBabyNames(origin, gender);
      res.json(names);
    } catch (error) {
      console.error("Error generating baby names:", error);
      res.status(500).json({ message: "Failed to generate baby names" });
    }
  });

  // Medication check schema
  const medicationNameSchema = z.object({
    medicationName: z.string()
  });

  app.post("/api/medication/check", validateRequest(medicationNameSchema), async (req: Request, res: Response) => {
    try {
      const { medicationName } = req.validatedData;
      const safetyInfo = await checkMedicationSafety(medicationName);
      res.json(safetyInfo);
    } catch (error) {
      console.error("Error checking medication:", error);
      res.status(500).json({ message: "Failed to check medication" });
    }
  });


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
