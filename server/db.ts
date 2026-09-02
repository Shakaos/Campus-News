import Database from 'better-sqlite3';

export const db = new Database('campus-news.db');

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    imageUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    status TEXT NOT NULL,
    currentProfessor TEXT,
    nextClass TEXT,
    capacity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS queue_sectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    currentNumber INTEGER NOT NULL,
    waitingCount INTEGER NOT NULL,
    averageServiceTime INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS queue_tickets (
    id TEXT PRIMARY KEY,
    sectorId TEXT NOT NULL,
    userId TEXT NOT NULL,
    number INTEGER NOT NULL,
    position INTEGER NOT NULL,
    estimatedTime INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    classId TEXT NOT NULL,
    professorId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lab_reservations (
    id TEXT PRIMARY KEY,
    labName TEXT NOT NULL,
    professorId TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    purpose TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS class_notices (
    id TEXT PRIMARY KEY,
    classId TEXT NOT NULL,
    professorId TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

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

const seedNews = [
  {
    id: '1',
    title: 'Semana de Tecnologia 2026',
    category: 'evento',
    summary: 'Participe das palestras e workshops sobre IA e Desenvolvimento Sustentável.',
    content:
      'A Semana de Tecnologia deste ano focará em como a Inteligência Artificial pode auxiliar no desenvolvimento de soluções sustentáveis para o planeta. Teremos convidados de grandes empresas de tecnologia e pesquisadores renomados.',
    date: '2026-04-15',
    imageUrl: 'https://picsum.photos/seed/tech/800/400',
  },
  {
    id: '2',
    title: 'Manutenção no Bloco B',
    category: 'urgente',
    summary: 'As salas do Bloco B estarão fechadas para manutenção elétrica amanhã.',
    content:
      'Devido a uma manutenção emergencial na rede elétrica, todas as salas do Bloco B estarão inacessíveis no dia 14/04. As aulas serão realocadas para o Bloco C.',
    date: '2026-04-13',
    imageUrl: 'https://picsum.photos/seed/warning/800/400',
  },
  {
    id: '3',
    title: 'Novos horários da Biblioteca',
    category: 'aviso',
    summary: 'A biblioteca agora funcionará até as 22h durante o período de provas.',
    content:
      'Para apoiar os estudantes durante a semana de exames, a biblioteca central estenderá seu horário de funcionamento. Aproveite o espaço para estudos em grupo e consultas ao acervo.',
    date: '2026-04-10',
    imageUrl: 'https://picsum.photos/seed/library/800/400',
  },
];

const seedRooms = [
  {
    id: '101',
    name: 'Laboratório 01',
    building: 'Bloco A',
    floor: 'Térreo',
    status: 'ocupada',
    currentProfessor: 'Dr. Silva',
    nextClass: '14:00 - Redes',
    capacity: 30,
  },
  {
    id: '102',
    name: 'Sala 204',
    building: 'Bloco A',
    floor: '2º Andar',
    status: 'disponível',
    currentProfessor: null,
    nextClass: '16:00 - Cálculo I',
    capacity: 45,
  },
  {
    id: '103',
    name: 'Auditório Central',
    building: 'Bloco C',
    floor: 'Térreo',
    status: 'disponível',
    currentProfessor: null,
    nextClass: '19:00 - Palestra Magna',
    capacity: 200,
  },
  {
    id: '104',
    name: 'Laboratório de Química',
    building: 'Bloco B',
    floor: '1º Andar',
    status: 'manutenção',
    currentProfessor: null,
    nextClass: null,
    capacity: 25,
  },
];

const seedSectors = [
  {
    id: 'sec1',
    name: 'Secretaria Acadêmica',
    description: 'Matrículas, históricos e documentos.',
    currentNumber: 45,
    waitingCount: 12,
    averageServiceTime: 8,
  },
  {
    id: 'sec2',
    name: 'Financeiro',
    description: 'Pagamentos, bolsas e negociações.',
    currentNumber: 12,
    waitingCount: 3,
    averageServiceTime: 15,
  },
  {
    id: 'sec3',
    name: 'Coordenação de Curso',
    description: 'Dúvidas pedagógicas e estágios.',
    currentNumber: 8,
    waitingCount: 5,
    averageServiceTime: 20,
  },
];

const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (countUsers.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, role, email, password)
    VALUES (@id, @name, @role, @email, @password)
  `);
  const insertManyUsers = db.transaction((rows) => {
    for (const row of rows) insertUser.run(row);
  });
  insertManyUsers(seedUsers);
}

const countNews = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };
if (countNews.count === 0) {
  const insertNews = db.prepare(`
    INSERT INTO news (id, title, category, summary, content, date, imageUrl)
    VALUES (@id, @title, @category, @summary, @content, @date, @imageUrl)
  `);
  const insertManyNews = db.transaction((rows) => {
    for (const row of rows) insertNews.run(row);
  });
  insertManyNews(seedNews);
}

const countRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };
if (countRooms.count === 0) {
  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, name, building, floor, status, currentProfessor, nextClass, capacity)
    VALUES (@id, @name, @building, @floor, @status, @currentProfessor, @nextClass, @capacity)
  `);
  const insertManyRooms = db.transaction((rows) => {
    for (const row of rows) insertRoom.run(row);
  });
  insertManyRooms(seedRooms);
}

const countSectors = db.prepare('SELECT COUNT(*) as count FROM queue_sectors').get() as { count: number };
if (countSectors.count === 0) {
  const insertSector = db.prepare(`
    INSERT INTO queue_sectors (id, name, description, currentNumber, waitingCount, averageServiceTime)
    VALUES (@id, @name, @description, @currentNumber, @waitingCount, @averageServiceTime)
  `);
  const insertManySectors = db.transaction((rows) => {
    for (const row of rows) insertSector.run(row);
  });
  insertManySectors(seedSectors);
}

export type DbUser = {
  id: string;
  name: string;
  role: 'aluno' | 'professor' | 'admin';
  email: string;
  password: string;
};

export type DbNews = {
  id: string;
  title: string;
  category: 'urgente' | 'evento' | 'aviso';
  summary: string;
  content: string;
  date: string;
  imageUrl?: string | null;
};

export type DbRoom = {
  id: string;
  name: string;
  building: string;
  floor: string;
  status: 'disponível' | 'ocupada' | 'manutenção';
  currentProfessor?: string | null;
  nextClass?: string | null;
  capacity: number;
};

export type DbQueueSector = {
  id: string;
  name: string;
  description: string;
  currentNumber: number;
  waitingCount: number;
  averageServiceTime: number;
};
