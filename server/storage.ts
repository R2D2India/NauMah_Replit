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
  type JournalEntry,
  waitlistTable,
  journalEntriesTable
} from "@shared/schema";
import { addWeeks } from "date-fns";
import { db } from "./db";
import { PgStorage } from './pgStorage';

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profileData: { firstName?: string; lastName?: string; profilePicture?: string }): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  
  // Password reset methods
  createPasswordResetToken(token: { userId: number; token: string; expiresAt: Date; isUsed: boolean }): Promise<any>;
  getValidPasswordResetToken(token: string): Promise<any>;
  markPasswordResetTokenAsUsed(id: number): Promise<any>;
  
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
  
  // Journal entries methods
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: { userId: number; title: string; content: string; mood?: string; date: Date }): Promise<JournalEntry>;
  
  // Email tracking methods
  trackEmail(entry: { userId: number; emailType: string; emailTo: string; emailFrom: string; subject: string; status: string; statusDetails?: string }): Promise<any>;
  getEmailTrackingByUser(userId: number): Promise<any[]>;
  getAllEmailTracking(): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pregnancyData: Map<number, PregnancyData>; // userId -> data
  private moodEntries: Map<number, MoodEntry[]>; // userId -> entries
  private medicationChecks: Map<number, MedicationCheck[]>; // userId -> checks
  private weightEntries: Map<number, WeightEntry[]>; // userId -> entries
  private symptomEntries: Map<number, SymptomEntry[]>; // userId -> entries
  private appointments: Map<number, Appointment[]>; // userId -> entries
  private supportMessages: SupportMessage[]; // all support messages
  private journalEntries: Map<number, JournalEntry[]>; // userId -> entries
  private emailTracking: Map<number, { 
    id: number; 
    userId: number; 
    emailType: string; 
    emailTo: string; 
    emailFrom: string; 
    subject: string; 
    status: string; 
    statusDetails?: string;
    sentAt: Date; 
    updatedAt: Date; 
  }[]>; // userId -> email tracking entries
  private currentId: number;
  private pregnancyDataId: number;
  private moodEntryId: number;
  private medicationCheckId: number;
  private weightEntryId: number;
  private symptomEntryId: number;
  private appointmentId: number;
  private supportMessageId: number;
  private journalEntryId: number;
  private emailTrackingId: number;

  private passwordResetTokens: Map<number, { id: number; userId: number; token: string; expiresAt: Date; isUsed: boolean; createdAt: Date }>;
  private passwordResetTokenId: number;

  constructor() {
    this.users = new Map();
    this.pregnancyData = new Map();
    this.moodEntries = new Map();
    this.medicationChecks = new Map();
    this.weightEntries = new Map();
    this.symptomEntries = new Map();
    this.appointments = new Map();
    this.supportMessages = [];
    this.journalEntries = new Map();
    this.emailTracking = new Map();
    this.passwordResetTokens = new Map();
    this.currentId = 1;
    this.pregnancyDataId = 1;
    this.moodEntryId = 1;
    this.medicationCheckId = 1;
    this.weightEntryId = 1;
    this.symptomEntryId = 1;
    this.appointmentId = 1;
    this.supportMessageId = 1;
    this.journalEntryId = 1;
    this.emailTrackingId = 1;
    this.passwordResetTokenId = 1;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      mobileNumber: insertUser.mobileNumber || null,
      age: insertUser.age ? Number(insertUser.age) : null,
      pregnancyWeek: insertUser.pregnancyWeek || null,
      pregnancyMonth: insertUser.pregnancyMonth || null,
      pregnancyTrimester: insertUser.pregnancyTrimester || null,
      profilePicture: insertUser.profilePicture || null,
      isEmailVerified: insertUser.isEmailVerified || false,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(id: number, profileData: { firstName?: string; lastName?: string; profilePicture?: string }): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser = {
      ...user,
      ...profileData,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Password reset methods
  async createPasswordResetToken(token: { userId: number; token: string; expiresAt: Date; isUsed: boolean }): Promise<any> {
    const id = this.passwordResetTokenId++;
    const resetToken = {
      ...token,
      id,
      createdAt: new Date()
    };
    
    this.passwordResetTokens.set(id, resetToken);
    return resetToken;
  }
  
  async getValidPasswordResetToken(token: string): Promise<any> {
    const now = new Date();
    return Array.from(this.passwordResetTokens.values()).find(
      (t) => t.token === token && !t.isUsed && t.expiresAt > now
    );
  }
  
  async markPasswordResetTokenAsUsed(id: number): Promise<any> {
    const token = this.passwordResetTokens.get(id);
    if (!token) {
      throw new Error(`Reset token with ID ${id} not found`);
    }
    
    const updatedToken = {
      ...token,
      isUsed: true
    };
    
    this.passwordResetTokens.set(id, updatedToken);
    return updatedToken;
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
  
  // Support messages methods
  async getSupportMessages(): Promise<SupportMessage[]> {
    return this.supportMessages;
  }
  
  async createSupportMessage(message: ContactFormData): Promise<SupportMessage> {
    const id = this.supportMessageId++;
    const supportMessage: SupportMessage = {
      id,
      name: message.name,
      email: message.email,
      subject: message.subject || null,
      message: message.message,
      isRead: false,
      createdAt: new Date()
    };
    
    this.supportMessages.push(supportMessage);
    return supportMessage;
  }
  
  async markSupportMessageAsRead(id: number): Promise<SupportMessage> {
    const index = this.supportMessages.findIndex(message => message.id === id);
    if (index === -1) {
      throw new Error(`Support message with ID ${id} not found`);
    }
    
    this.supportMessages[index] = {
      ...this.supportMessages[index],
      isRead: true
    };
    
    return this.supportMessages[index];
  }
  
  // Email tracking methods
  async trackEmail(entry: { 
    userId: number; 
    emailType: string; 
    emailTo: string;
    emailFrom: string;
    subject: string;
    status: string;
    statusDetails?: string 
  }): Promise<any> {
    const id = this.emailTrackingId++;
    const now = new Date();
    
    const trackingEntry = {
      id,
      userId: entry.userId,
      emailType: entry.emailType,
      emailTo: entry.emailTo,
      emailFrom: entry.emailFrom,
      subject: entry.subject,
      status: entry.status,
      statusDetails: entry.statusDetails,
      sentAt: now,
      updatedAt: now
    };
    
    // Initialize array if it doesn't exist
    if (!this.emailTracking.has(entry.userId)) {
      this.emailTracking.set(entry.userId, []);
    }
    
    // Add entry to array
    const entries = this.emailTracking.get(entry.userId)!;
    entries.push(trackingEntry);
    
    return trackingEntry;
  }
  
  async getEmailTrackingByUser(userId: number): Promise<any[]> {
    return this.emailTracking.get(userId) || [];
  }
  
  async getAllEmailTracking(): Promise<any[]> {
    const allTracking: any[] = [];
    this.emailTracking.forEach((userTracking) => {
      allTracking.push(...userTracking);
    });
    
    // Sort by sent date, newest first
    return allTracking.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  // Journal entries methods
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return this.journalEntries.get(userId) || [];
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    for (const entries of Array.from(this.journalEntries.values())) {
      const entry = entries.find((entry: JournalEntry) => entry.id === id);
      if (entry) return entry;
    }
    return undefined;
  }

  async createJournalEntry(entry: { userId: number; title: string; content: string; mood?: string; date: Date }): Promise<JournalEntry> {
    const id = this.journalEntryId++;
    const journalEntry: JournalEntry = {
      id,
      userId: entry.userId,
      title: entry.title,
      content: entry.content,
      mood: entry.mood || null,
      date: entry.date,
      createdAt: new Date()
    };

    // Initialize array if it doesn't exist
    if (!this.journalEntries.has(entry.userId)) {
      this.journalEntries.set(entry.userId, []);
    }

    // Add entry to array
    const entries = this.journalEntries.get(entry.userId)!;
    entries.push(journalEntry);

    return journalEntry;
  }
}

// Use PostgreSQL storage for persistence
export const storage = new PgStorage();
