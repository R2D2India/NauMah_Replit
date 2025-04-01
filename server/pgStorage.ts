import { eq } from 'drizzle-orm';
import { db } from './db';
import { 
  users, type User, type InsertUser,
  pregnancyData, type PregnancyData, type InsertPregnancyData,
  moodEntries, type MoodEntry, type InsertMoodEntry,
  medicationChecks, type MedicationCheck, type InsertMedicationCheck,
  type PregnancyStageUpdate
} from "@shared/schema";
import { IStorage } from './storage';
import { addWeeks } from "date-fns";

export class PgStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }

  // Pregnancy data methods
  async getPregnancyData(userId: number): Promise<PregnancyData | undefined> {
    const results = await db.select().from(pregnancyData).where(eq(pregnancyData.userId, userId));
    return results[0];
  }

  async updatePregnancyStage(userId: number, update: PregnancyStageUpdate): Promise<PregnancyData> {
    // Calculate current week based on the provided stage type and value
    let currentWeek = 1;
    
    if (update.stageType === "week") {
      currentWeek = parseInt(update.stageValue);
    } else if (update.stageType === "month") {
      // Approximate conversion: 1 month ≈ 4.3 weeks
      currentWeek = Math.round(parseFloat(update.stageValue) * 4.3);
    } else if (update.stageType === "trimester") {
      // Approximate conversion: 1st trimester = weeks 1-13, 2nd = 14-26, 3rd = 27-40
      const trimesterValue = parseInt(update.stageValue);
      currentWeek = trimesterValue === 1 ? 7 : trimesterValue === 2 ? 20 : 33; // Middle of each trimester
    }
    
    // Calculate due date based on current week (40 weeks total for pregnancy)
    const weeksLeft = 40 - currentWeek;
    const dueDate = addWeeks(new Date(), weeksLeft);
    
    // Check if data exists
    const existingData = await this.getPregnancyData(userId);
    
    if (existingData) {
      // Update existing record
      const results = await db.update(pregnancyData)
        .set({ 
          currentWeek, 
          dueDate, 
          updatedAt: new Date() 
        })
        .where(eq(pregnancyData.id, existingData.id))
        .returning();
      return results[0];
    } else {
      // Create new record
      const results = await db.insert(pregnancyData)
        .values({ 
          userId, 
          currentWeek, 
          dueDate,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return results[0];
    }
  }

  // Mood entries methods
  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries).where(eq(moodEntries.userId, userId));
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const results = await db.insert(moodEntries).values(insertEntry).returning();
    return results[0];
  }

  // Medication check methods
  async getMedicationChecks(userId: number): Promise<MedicationCheck[]> {
    return await db.select().from(medicationChecks).where(eq(medicationChecks.userId, userId));
  }

  async createMedicationCheck(insertCheck: InsertMedicationCheck): Promise<MedicationCheck> {
    const results = await db.insert(medicationChecks).values(insertCheck).returning();
    return results[0];
  }
}