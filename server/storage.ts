import { 
  users, type User, type InsertUser,
  pregnancyData, type PregnancyData, type InsertPregnancyData,
  moodEntries, type MoodEntry, type InsertMoodEntry,
  medicationChecks, type MedicationCheck, type InsertMedicationCheck,
  type PregnancyStageUpdate
} from "@shared/schema";
import { addWeeks } from "date-fns";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Waitlist methods
  createWaitlistEntry(entry: { name: string; mobile: string; email: string }): Promise<any>;
  getWaitlistEntries(): Promise<any[]>;
  
  // Pregnancy data methods
  getPregnancyData(userId: number): Promise<PregnancyData | undefined>;
  updatePregnancyStage(userId: number, update: PregnancyStageUpdate): Promise<PregnancyData>;
  
  // Mood entries methods
  getMoodEntries(userId: number): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  
  // Medication check methods
  getMedicationChecks(userId: number): Promise<MedicationCheck[]>;
  createMedicationCheck(check: InsertMedicationCheck): Promise<MedicationCheck>;
  createWaitlistEntry(entry: { name: string; mobile: string; email: string }): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pregnancyData: Map<number, PregnancyData>; // userId -> data
  private moodEntries: Map<number, MoodEntry[]>; // userId -> entries
  private medicationChecks: Map<number, MedicationCheck[]>; // userId -> checks
  private currentId: number;
  private pregnancyDataId: number;
  private moodEntryId: number;
  private medicationCheckId: number;

  constructor() {
    this.users = new Map();
    this.pregnancyData = new Map();
    this.moodEntries = new Map();
    this.medicationChecks = new Map();
    this.currentId = 1;
    this.pregnancyDataId = 1;
    this.moodEntryId = 1;
    this.medicationCheckId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Pregnancy data methods
  async getPregnancyData(userId: number): Promise<PregnancyData | undefined> {
    return Array.from(this.pregnancyData.values()).find(
      (data) => data.userId === userId,
    );
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
      const trimesterValue = parseInt(update.stageValue.charAt(0));
      currentWeek = trimesterValue === 1 ? 7 : trimesterValue === 2 ? 20 : 33; // Middle of each trimester
    }
    
    // Calculate due date based on current week (40 weeks total for pregnancy)
    const weeksLeft = 40 - currentWeek;
    const dueDate = addWeeks(new Date(), weeksLeft);
    
    // Get existing data or create new
    let data = await this.getPregnancyData(userId);
    
    if (data) {
      // Update existing record
      data = {
        ...data,
        currentWeek,
        dueDate,
        updatedAt: new Date(),
      };
    } else {
      // Create new record
      const id = this.pregnancyDataId++;
      data = {
        id,
        userId,
        currentWeek,
        dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    this.pregnancyData.set(data.id, data);
    return data;
  }

  // Mood entries methods
  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return this.moodEntries.get(userId) || [];
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.moodEntryId++;
    const entry: MoodEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
    };
    
    // Initialize array if it doesn't exist
    if (!this.moodEntries.has(entry.userId)) {
      this.moodEntries.set(entry.userId, []);
    }
    
    // Add entry to array
    const entries = this.moodEntries.get(entry.userId)!;
    entries.push(entry);
    
    return entry;
  }

  // Medication check methods
  async getMedicationChecks(userId: number): Promise<MedicationCheck[]> {
    return this.medicationChecks.get(userId) || [];
  }

  async createMedicationCheck(insertCheck: InsertMedicationCheck): Promise<MedicationCheck> {
    const id = this.medicationCheckId++;
    const check: MedicationCheck = {
      ...insertCheck,
      id,
      createdAt: new Date(),
    };
    
    // Initialize array if it doesn't exist
    if (!this.medicationChecks.has(check.userId)) {
      this.medicationChecks.set(check.userId, []);
    }
    
    // Add check to array
    const checks = this.medicationChecks.get(check.userId)!;
    checks.push(check);
    
    return check;
  }

  async createWaitlistEntry(entry: { name: string; mobile: string; email: string }): Promise<any> {
    const result = await db.insert(waitlistTable)
      .values({
        name: entry.name,
        mobile: entry.mobile,
        email: entry.email
      })
      .returning();
    return result[0];
  }
}

export const storage = new MemStorage();
