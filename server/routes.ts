import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pregnancyStageSchema, medicationCheckSchema, moodEntrySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to handle validation errors consistently
  const validateRequest = (schema: any) => {
    return (req: any, res: any, next: any) => {
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
  const existingDemoUser = await storage.getUser(demoUserId);
  if (!existingDemoUser) {
    await storage.createUser({
      username: "demo",
      password: "password", // In a real app, this would be hashed
    });
  }

  // Get pregnancy data for a user
  app.get("/api/pregnancy", async (req, res) => {
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
  app.post("/api/pregnancy/stage", validateRequest(pregnancyStageSchema), async (req, res) => {
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
  app.get("/api/mood", async (req, res) => {
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
  app.post("/api/mood", validateRequest(moodEntrySchema), async (req, res) => {
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
  app.get("/api/medication", async (req, res) => {
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
  app.post("/api/medication/check", validateRequest(medicationCheckSchema), async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
