// create_tables.ts
import { pool, db } from './server/db';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema';

async function createTables() {
  try {
    console.log('Creating missing tables from schema...');
    
    // Create the email tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email_type TEXT NOT NULL,
        email_to TEXT NOT NULL,
        email_from TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        status_details TEXT,
        sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Tables created successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating tables:', error);
    await pool.end();
    process.exit(1);
  }
}

createTables();
