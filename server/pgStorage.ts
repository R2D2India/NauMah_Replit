import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import { 
  users, type User, type InsertUser,
  pregnancyData, type PregnancyData, type InsertPregnancyData,
  moodEntries, type MoodEntry, type InsertMoodEntry,
  medicationChecks, type MedicationCheck, type InsertMedicationCheck,
  type PregnancyStageUpdate,
  waitlistTable,
  weightTrackingTable,
  symptomsTable,
  appointmentsTable,
  supportMessagesTable,
  journalEntriesTable,
  type WeightEntry,
  type SymptomEntry,
  type Appointment,
  type SupportMessage,
  type JournalEntry,
  type ContactFormData
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
    const results = await db.select().from(medicationChecks).where(eq(medicationChecks.userId, userId));
    return results;
  }

  async createMedicationCheck(insertCheck: InsertMedicationCheck): Promise<MedicationCheck> {
    const results = await db.insert(medicationChecks).values(insertCheck).returning();
    return results[0];
  }

  // Waitlist methods
  async checkWaitlistDuplicate(email: string, mobile: string): Promise<{ exists: boolean, field?: string }> {
    // Check for duplicate email
    const emailExists = await db.select().from(waitlistTable).where(eq(waitlistTable.email, email)).limit(1);
    if (emailExists.length > 0) {
      return { exists: true, field: 'email' };
    }
    
    // Check for duplicate mobile number
    const mobileExists = await db.select().from(waitlistTable).where(eq(waitlistTable.mobile, mobile)).limit(1);
    if (mobileExists.length > 0) {
      return { exists: true, field: 'mobile' };
    }
    
    // No duplicates found
    return { exists: false };
  }
  
  async createWaitlistEntry(entry: { name: string; mobile: string; email: string }): Promise<any> {
    // Check for duplicates before inserting
    const duplicateCheck = await this.checkWaitlistDuplicate(entry.email, entry.mobile);
    if (duplicateCheck.exists) {
      throw new Error(`A user with this ${duplicateCheck.field} already exists in our waitlist.`);
    }
    
    const results = await db.insert(waitlistTable).values(entry).returning();
    return results[0];
  }

  async getWaitlistEntries(): Promise<any[]> {
    return await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt));
  }

  // Weight tracking methods
  async getWeightEntries(userId: number): Promise<WeightEntry[]> {
    const results = await db.select().from(weightTrackingTable).where(eq(weightTrackingTable.userId, userId));
    // Convert null to undefined for type compatibility
    return results.map(entry => ({
      ...entry,
      notes: entry.notes || undefined
    }));
  }

  async createWeightEntry(entry: { userId: number; weight: number; date: Date; notes?: string }): Promise<WeightEntry> {
    const results = await db.insert(weightTrackingTable).values({
      userId: entry.userId,
      weight: entry.weight,
      date: entry.date,
      notes: entry.notes || null,
      createdAt: new Date()
    }).returning();
    // Convert null to undefined for type compatibility
    return {
      ...results[0],
      notes: results[0].notes || undefined
    };
  }

  // Symptoms methods
  async getSymptomEntries(userId: number): Promise<SymptomEntry[]> {
    const results = await db.select().from(symptomsTable).where(eq(symptomsTable.userId, userId));
    // Convert null to undefined for type compatibility
    return results.map(entry => ({
      ...entry,
      notes: entry.notes || undefined
    }));
  }

  async createSymptomEntry(entry: { userId: number; symptom: string; severity: number; date: Date; notes?: string }): Promise<SymptomEntry> {
    const results = await db.insert(symptomsTable).values({
      userId: entry.userId,
      symptom: entry.symptom,
      severity: entry.severity,
      date: entry.date,
      notes: entry.notes || null,
      createdAt: new Date()
    }).returning();
    // Convert null to undefined for type compatibility
    return {
      ...results[0],
      notes: results[0].notes || undefined
    };
  }

  // Appointments methods
  async getAppointments(userId: number): Promise<Appointment[]> {
    const results = await db.select().from(appointmentsTable).where(eq(appointmentsTable.userId, userId));
    // Convert null to undefined for type compatibility
    return results.map(appointment => ({
      ...appointment,
      notes: appointment.notes || undefined,
      location: appointment.location || undefined
    }));
  }

  async createAppointment(appointment: { userId: number; title: string; type: string; date: Date; location?: string; notes?: string }): Promise<Appointment> {
    const results = await db.insert(appointmentsTable).values({
      userId: appointment.userId,
      title: appointment.title,
      type: appointment.type,
      date: appointment.date,
      location: appointment.location || null,
      notes: appointment.notes || null,
      createdAt: new Date()
    }).returning();
    // Convert null to undefined for type compatibility
    return {
      ...results[0],
      notes: results[0].notes || undefined,
      location: results[0].location || undefined
    };
  }

  // Support messages methods
  async getSupportMessages(): Promise<SupportMessage[]> {
    return await db.select().from(supportMessagesTable).orderBy(desc(supportMessagesTable.createdAt));
  }

  async createSupportMessage(message: ContactFormData): Promise<SupportMessage> {
    const results = await db.insert(supportMessagesTable).values({
      name: message.name,
      email: message.email,
      subject: message.subject || null,
      message: message.message,
      isRead: false,
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async markSupportMessageAsRead(id: number): Promise<SupportMessage> {
    const results = await db.update(supportMessagesTable)
      .set({ isRead: true })
      .where(eq(supportMessagesTable.id, id))
      .returning();
    return results[0];
  }

  // Journal entries methods
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    const results = await db.select()
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.userId, userId))
      .orderBy(desc(journalEntriesTable.date));
    
    // Convert null to undefined for type compatibility
    return results.map(entry => ({
      ...entry,
      mood: entry.mood || null
    }));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const results = await db.select()
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.id, id))
      .limit(1);
    
    if (results.length === 0) {
      return undefined;
    }
    
    // Convert null to undefined for type compatibility
    return {
      ...results[0],
      mood: results[0].mood || null
    };
  }

  async createJournalEntry(entry: { userId: number; title: string; content: string; mood?: string; date: Date }): Promise<JournalEntry> {
    const results = await db.insert(journalEntriesTable)
      .values({
        userId: entry.userId,
        title: entry.title,
        content: entry.content,
        mood: entry.mood || null,
        date: entry.date,
        createdAt: new Date()
      })
      .returning();
    
    // Convert null to undefined for type compatibility
    return {
      ...results[0],
      mood: results[0].mood || null
    };
  }
}