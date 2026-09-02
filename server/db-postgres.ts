import { Pool } from 'pg';

export let db: any;

export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Use PostgreSQL (production on Supabase)
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log('🚀 Using PostgreSQL from Supabase');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        imageUrl TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        building TEXT NOT NULL,
        floor TEXT NOT NULL,
        status TEXT NOT NULL,
        currentProfessor TEXT,
        nextClass TEXT,
        capacity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS queue_sectors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        currentNumber INTEGER NOT NULL,
        waitingCount INTEGER NOT NULL,
        averageServiceTime INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS queue_tickets (
        id TEXT PRIMARY KEY,
        sectorId TEXT NOT NULL,
        userId TEXT NOT NULL,
        number INTEGER NOT NULL,
        position INTEGER NOT NULL,
        estimatedTime INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        classId TEXT NOT NULL,
        professorId TEXT NOT NULL,
        studentName TEXT NOT NULL,
        status TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lab_reservations (
        id TEXT PRIMARY KEY,
        labName TEXT NOT NULL,
        professorId TEXT NOT NULL,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        purpose TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS class_notices (
        id TEXT PRIMARY KEY,
        classId TEXT NOT NULL,
        professorId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed data
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userCount.rows[0].count === 0) {
      const seedUsers = [
        {
          id: 'user-admin-1',
          name: 'Admin Campus',
          role: 'admin',
          email: 'admin@campus.edu',
          password: 'admin123',
        },
        {
          id: 'user-prof-1',
          name: 'Prof. Silva',
          role: 'professor',
          email: 'professor@campus.edu',
          password: 'prof123',
        },
        {
          id: 'user-aluno-1',
          name: 'João Estudante',
          role: 'aluno',
          email: 'aluno@campus.edu',
          password: 'aluno123',
        },
      ];

      for (const user of seedUsers) {
        await pool.query(
          'INSERT INTO users (id, name, role, email, password) VALUES ($1, $2, $3, $4, $5)',
          [user.id, user.name, user.role, user.email, user.password]
        );
      }
    }

    const newsCount = await pool.query('SELECT COUNT(*) as count FROM news');
    if (newsCount.rows[0].count === 0) {
      const seedNews = [
        {
          id: '1',
          title: 'Semana de Tecnologia 2026',
          category: 'evento',
          summary: 'Participe das palestras e workshops sobre IA e Desenvolvimento Sustentável.',
          content:
            'A Semana de Tecnologia deste ano focará em como a Inteligência Artificial pode auxiliar no desenvolvimento de soluções sustentáveis para o planeta.',
          date: '2026-04-15',
          imageUrl: 'https://picsum.photos/seed/tech/800/400',
        },
        {
          id: '2',
          title: 'Manutenção no Bloco B',
          category: 'urgente',
          summary: 'As salas do Bloco B estarão fechadas para manutenção elétrica amanhã.',
          content:
            'Devido a uma manutenção emergencial na rede elétrica, todas as salas do Bloco B estarão inacessíveis no dia 14/04.',
          date: '2026-04-13',
          imageUrl: 'https://picsum.photos/seed/warning/800/400',
        },
      ];

      for (const news of seedNews) {
        await pool.query(
          'INSERT INTO news (id, title, category, summary, content, date, imageUrl) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [news.id, news.title, news.category, news.summary, news.content, news.date, news.imageUrl]
        );
      }
    }

    return pool;
  } else {
    // Use SQLite (local development)
    console.log('🚀 Using SQLite (local development)');
    import('./db.js').then(mod => {
      db = mod.db;
    });
    return null;
  }
}

// Wrapper functions to work with both SQLite and PostgreSQL
export const dbQuery = {
  prepare: (sql: string) => ({
    run: (params?: any) => {
      // For SQLite compatibility
      return db?.prepare(sql).run(params);
    },
    get: (params?: any) => {
      // For SQLite compatibility
      return db?.prepare(sql).get(params);
    },
    all: (params?: any) => {
      // For SQLite compatibility
      return db?.prepare(sql).all(params);
    },
  }),
};
