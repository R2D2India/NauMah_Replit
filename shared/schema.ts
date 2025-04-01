import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const pregnancyData = pgTable("pregnancy_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currentWeek: integer("current_week").notNull(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  week: integer("week").notNull(),
  mood: text("mood").notNull(), // "great", "good", "okay", "low", "stressed"
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationChecks = pgTable("medication_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicationName: text("medication_name").notNull(),
  isSafe: boolean("is_safe"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPregnancyDataSchema = createInsertSchema(pregnancyData).pick({
  userId: true,
  currentWeek: true,
  dueDate: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  week: true,
  mood: true,
  note: true,
});

export const insertMedicationCheckSchema = createInsertSchema(medicationChecks).pick({
  userId: true,
  medicationName: true,
  isSafe: true,
  notes: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPregnancyData = z.infer<typeof insertPregnancyDataSchema>;
export type PregnancyData = typeof pregnancyData.$inferSelect;

export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;

export type InsertMedicationCheck = z.infer<typeof insertMedicationCheckSchema>;
export type MedicationCheck = typeof medicationChecks.$inferSelect;

// Pregnancy stage update schema
export const pregnancyStageSchema = z.object({
  stageType: z.enum(["week", "month", "trimester"]),
  stageValue: z.string(),
});

export type PregnancyStageUpdate = z.infer<typeof pregnancyStageSchema>;

// Medication check schema
export const medicationCheckSchema = z.object({
  medicationName: z.string().min(1, "Medication name is required"),
});

export type MedicationCheckRequest = z.infer<typeof medicationCheckSchema>;

// Mood entry schema
export const moodEntrySchema = z.object({
  mood: z.enum(["great", "good", "okay", "low", "stressed"]),
  note: z.string().optional(),
});

export type MoodEntryRequest = z.infer<typeof moodEntrySchema>;

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waitlistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  email: z.string().email("Invalid email address"),
});

export type WaitlistEntry = typeof waitlistTable.$inferSelect;
export type InsertWaitlistEntry = typeof waitlistTable.$inferInsert;