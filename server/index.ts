import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { db } from './db.js';
import { errorHandler, asyncHandler } from './middleware.js';
import { LoginSchema, NewsSchema, RoomSchema, AttendanceSchema, LabReservationSchema, ClassNoticeSchema } from './schemas.js';
import {
  addQueueTicket,
  createAttendance,
  createClassNotice,
  createLabReservation,
  createNews,
  createRoom,
  deleteClassNotice,
  deleteLabReservation,
  deleteNews,
  deleteRoom,
  findUserByEmailOrRole,
  getAttendanceByClass,
  getClassNoticesByClass,
  getLabReservationsByProfessor,
  getNews,
  getQueueSectors,
  getRooms,
  getUsers,
  updateAttendance,
  updateNews,
  updateRoom,
} from './dbHelpers.js';
import { generateId, generateNewsId, generateRoomId, sanitizeUser, verifyPassword } from './utils.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4001);
const JWT_SECRET = process.env.JWT_SECRET ?? 'campus-news-dev-secret';

app.use(cors());
app.use(express.json());

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação ausente.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.sub) as any;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    (req as Request & { user?: any }).user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user?: any }).user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' });
  }

  return next();
};

const professorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user?: any }).user;

  if (!user || user.role !== 'professor') {
    return res.status(403).json({ message: 'Acesso restrito a professores.' });
  }

  return next();
};

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'campus-news-api', version: '1.0.0' });
});

// Auth
app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const { username, password } = parsed.data;
  const user = findUserByEmailOrRole(username) as any;

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const publicUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };

  return res.json({ token, user: publicUser });
}));

app.get('/api/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;

  if (!user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }

  return res.json(sanitizeUser(user));
});

// News CRUD
app.get('/api/news', (_req, res) => {
  res.json(getNews());
});

app.post('/api/news', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = NewsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const { title, category, summary, content, date, imageUrl } = parsed.data;
  const id = generateNewsId();
  const news = createNews({ id, title, category, summary, content, date: date || new Date().toISOString(), imageUrl });

  return res.status(201).json(news);
}));

app.put('/api/news/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = NewsSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const updated = updateNews(id, parsed.data);

  if (!updated) {
    return res.status(404).json({ message: 'Notícia não encontrada.' });
  }

  return res.json(updated);
}));

app.delete('/api/news/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  deleteNews(id);
  return res.json({ message: 'Notícia deletada com sucesso.' });
});

// Rooms CRUD
app.get('/api/rooms', (_req, res) => {
  res.json(getRooms());
});

app.post('/api/rooms', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = RoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const { name, building, floor, status, currentProfessor, nextClass, capacity } = parsed.data;
  const id = generateRoomId();
  const room = createRoom({ id, name, building, floor, status, currentProfessor, nextClass, capacity });

  return res.status(201).json(room);
}));

app.put('/api/rooms/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = RoomSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const updated = updateRoom(id, parsed.data);

  if (!updated) {
    return res.status(404).json({ message: 'Sala não encontrada.' });
  }

  return res.json(updated);
}));

app.delete('/api/rooms/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  deleteRoom(id);
  return res.json({ message: 'Sala deletada com sucesso.' });
});

// Queue
app.get('/api/sectors', (_req, res) => {
  res.json(getQueueSectors());
});

app.post('/api/queues/enter', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { sectorId } = req.body ?? {};
  const user = (req as Request & { user?: any }).user;

  if (!sectorId) {
    return res.status(400).json({ message: 'Setor obrigatório.' });
  }

  const sector = db.prepare('SELECT * FROM queue_sectors WHERE id = ?').get(sectorId) as any;

  if (!sector) {
    return res.status(404).json({ message: 'Setor não encontrado.' });
  }

  const nextNumber = sector.currentNumber + sector.waitingCount + 1;
  const position = sector.waitingCount + 1;
  const estimatedTime = (sector.waitingCount + 1) * sector.averageServiceTime;

  const ticket = {
    id: `ticket-${Date.now()}`,
    sectorId,
    userId: user!.id,
    number: nextNumber,
    position,
    estimatedTime,
    timestamp: new Date().toISOString(),
  };

  addQueueTicket(ticket);

  return res.status(201).json(ticket);
}));

// Professor endpoints - Attendance
app.post('/api/attendance', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = AttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const user = (req as Request & { user?: any }).user;
  const { studentName, status, classId, date } = parsed.data;
  const id = generateId();
  const attendance = createAttendance({
    id,
    classId,
    professorId: user.id,
    studentName,
    status,
    date: date || new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json(attendance);
}));

app.get('/api/attendance/:classId', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const { classId } = req.params;
  const attendance = getAttendanceByClass(classId);
  res.json(attendance);
});

app.put('/api/attendance/:id', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status obrigatório.' });
  }

  const updated = updateAttendance(id, { status });

  if (!updated) {
    return res.status(404).json({ message: 'Registro de presença não encontrado.' });
  }

  return res.json(updated);
}));

// Lab Reservations
app.post('/api/lab-reservations', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = LabReservationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const user = (req as Request & { user?: any }).user;
  const { labName, date, startTime, endTime, purpose } = parsed.data;
  const id = generateId();
  const reservation = createLabReservation({
    id,
    labName,
    professorId: user.id,
    date,
    startTime,
    endTime,
    purpose,
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json(reservation);
}));

app.get('/api/lab-reservations', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  const reservations = getLabReservationsByProfessor(user.id);
  res.json(reservations);
});

app.delete('/api/lab-reservations/:id', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  deleteLabReservation(id);
  return res.json({ message: 'Reserva deletada com sucesso.' });
});

// Class Notices
app.post('/api/class-notices', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = ClassNoticeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const user = (req as Request & { user?: any }).user;
  const { title, content, classId, date } = parsed.data;
  const id = generateId();
  const notice = createClassNotice({
    id,
    classId,
    professorId: user.id,
    title,
    content,
    date: date || new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json(notice);
}));

app.get('/api/class-notices/:classId', authMiddleware, (req: Request, res: Response) => {
  const { classId } = req.params;
  const notices = getClassNoticesByClass(classId);
  res.json(notices);
});

app.delete('/api/class-notices/:id', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  deleteClassNotice(id);
  return res.json({ message: 'Aviso deletado com sucesso.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.originalUrl}` });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Campus News API running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});
