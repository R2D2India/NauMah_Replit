import { 
  users, type User, type InsertUser,
  pregnancyData, type PregnancyData, type InsertPregnancyData,
  moodEntries, type MoodEntry, type InsertMoodEntry,
  medicationChecks, type MedicationCheck, type InsertMedicationCheck,
  type PregnancyStageUpdate,
  type WeightEntry,
  type SymptomEntry,
  type Appointment,
  type SupportMessage,
  type ContactFormData,
  waitlistTable
} from "@shared/schema";
import { addWeeks } from "date-fns";
import { db } from "./db";
import { PgStorage } from './pgStorage';

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

  // Weight tracking methods
  getWeightEntries(userId: number): Promise<WeightEntry[]>;
  createWeightEntry(entry: { userId: number; weight: number; date: Date; notes?: string }): Promise<WeightEntry>;
  
  // Symptoms methods
  getSymptomEntries(userId: number): Promise<SymptomEntry[]>;
  createSymptomEntry(entry: { userId: number; symptom: string; severity: number; date: Date; notes?: string }): Promise<SymptomEntry>;
  
  // Appointments methods
  getAppointments(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: { userId: number; title: string; type: string; date: Date; location?: string; notes?: string }): Promise<Appointment>;
  
  // Support messages methods
  getSupportMessages(): Promise<SupportMessage[]>;
  createSupportMessage(message: ContactFormData): Promise<SupportMessage>;
  markSupportMessageAsRead(id: number): Promise<SupportMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pregnancyData: Map<number, PregnancyData>; // userId -> data
  private moodEntries: Map<number, MoodEntry[]>; // userId -> entries
  private medicationChecks: Map<number, MedicationCheck[]>; // userId -> checks
  private weightEntries: Map<number, WeightEntry[]>; // userId -> entries
  private symptomEntries: Map<number, SymptomEntry[]>; // userId -> entries
  private appointments: Map<number, Appointment[]>; // userId -> entries
  private currentId: number;
  private pregnancyDataId: number;
  private moodEntryId: number;
  private medicationCheckId: number;
  private weightEntryId: number;
  private symptomEntryId: number;
  private appointmentId: number;

  constructor() {
    this.users = new Map();
    this.pregnancyData = new Map();
    this.moodEntries = new Map();
    this.medicationChecks = new Map();
    this.weightEntries = new Map();
    this.symptomEntries = new Map();
    this.appointments = new Map();
    this.currentId = 1;
    this.pregnancyDataId = 1;
    this.moodEntryId = 1;
    this.medicationCheckId = 1;
    this.weightEntryId = 1;
    this.symptomEntryId = 1;
    this.appointmentId = 1;
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
      id,
      userId: insertEntry.userId,
      week: insertEntry.week,
      mood: insertEntry.mood,
      note: insertEntry.note || null,
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
      id,
      userId: insertCheck.userId,
      medicationName: insertCheck.medicationName,
      isSafe: insertCheck.isSafe !== undefined ? insertCheck.isSafe : null,
      notes: insertCheck.notes || null,
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

  async getWaitlistEntries(): Promise<any[]> {
    return await db.select().from(waitlistTable);
  }

  // Weight tracking methods
  async getWeightEntries(userId: number): Promise<WeightEntry[]> {
    return this.weightEntries.get(userId) || [];
  }

  async createWeightEntry(entry: { userId: number; weight: number; date: Date; notes?: string }): Promise<WeightEntry> {
    const id = this.weightEntryId++;
    const weightEntry: WeightEntry = {
      id,
      userId: entry.userId,
      weight: entry.weight,
      date: entry.date,
      notes: entry.notes,
      createdAt: new Date()
    };

    // Initialize array if it doesn't exist
    if (!this.weightEntries.has(entry.userId)) {
      this.weightEntries.set(entry.userId, []);
    }

    // Add entry to array
    const entries = this.weightEntries.get(entry.userId)!;
    entries.push(weightEntry);

    return weightEntry;
  }

  // Symptoms methods
  async getSymptomEntries(userId: number): Promise<SymptomEntry[]> {
    return this.symptomEntries.get(userId) || [];
  }

  async createSymptomEntry(entry: { userId: number; symptom: string; severity: number; date: Date; notes?: string }): Promise<SymptomEntry> {
    const id = this.symptomEntryId++;
    const symptomEntry: SymptomEntry = {
      id,
      userId: entry.userId,
      symptom: entry.symptom,
      severity: entry.severity,
      date: entry.date,
      notes: entry.notes,
      createdAt: new Date()
    };

    // Initialize array if it doesn't exist
    if (!this.symptomEntries.has(entry.userId)) {
      this.symptomEntries.set(entry.userId, []);
    }

    // Add entry to array
    const entries = this.symptomEntries.get(entry.userId)!;
    entries.push(symptomEntry);

    return symptomEntry;
  }

  // Appointments methods
  async getAppointments(userId: number): Promise<Appointment[]> {
    return this.appointments.get(userId) || [];
  }

  async createAppointment(appointment: { userId: number; title: string; type: string; date: Date; location?: string; notes?: string }): Promise<Appointment> {
    const id = this.appointmentId++;
    const newAppointment: Appointment = {
      id,
      userId: appointment.userId,
      title: appointment.title,
      type: appointment.type,
      date: appointment.date,
      location: appointment.location,
      notes: appointment.notes,
      createdAt: new Date()
    };

    // Initialize array if it doesn't exist
    if (!this.appointments.has(appointment.userId)) {
      this.appointments.set(appointment.userId, []);
    }

    // Add appointment to array
    const entries = this.appointments.get(appointment.userId)!;
    entries.push(newAppointment);

    return newAppointment;
  }
}

// Use PostgreSQL storage for persistence
export const storage = new PgStorage();
