import { Pool } from 'pg';

export async function initializeDatabase(pool: Pool) {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        name TEXT NOT NULL,
        class_level TEXT,
        current_stream TEXT,
        city TEXT,
        preferred_language TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        section TEXT NOT NULL,
        riasec_code TEXT,
        subcategory TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create options table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        weight INTEGER,
        display_order INTEGER
      );
    `);

    // Create assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        scores JSONB,
        selected_question_ids JSONB,
        current_question_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create answers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        option_id INTEGER REFERENCES options(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create careers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS careers (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        stream TEXT,
        required_codes TEXT[],
        typical_degree TEXT
      );
    `);

    // Create engineering_branches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS engineering_branches (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        broad_work_area TEXT
      );
    `);

    // Create programmes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programmes (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER REFERENCES engineering_branches(id),
        stream TEXT NOT NULL,
        degree_level TEXT DEFAULT 'Undergraduate',
        degree_type TEXT NOT NULL,
        full_name TEXT NOT NULL,
        duration_years INTEGER DEFAULT 4,
        short_description TEXT,
        eligibility_12th_stream TEXT,
        key_tags TEXT[],
        ai_recommended BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create indexes for better query performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_answers_assessment_id ON answers(assessment_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_engineering_branches_slug ON engineering_branches(slug);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_programmes_stream ON programmes(stream);`);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}