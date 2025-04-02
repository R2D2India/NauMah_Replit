import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

// Initialize a PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle with the pool and schema
export const db = drizzle(pool, { schema });

// Prepare function to run migrations during development
export async function runMigrations() {
  try {
    // Note: In a production app, you would use a migration tool like drizzle-kit
    // We're creating tables directly here for simplicity
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS pregnancy_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        current_week INTEGER NOT NULL,
        due_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS mood_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        week INTEGER NOT NULL,
        mood TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS medication_checks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        medication_name TEXT NOT NULL,
        is_safe BOOLEAN,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
}