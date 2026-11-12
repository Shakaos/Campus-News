import cors from 'cors';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

import { db } from './db.js';
import { ApiError, errorHandler, asyncHandler } from './middleware.js';
import { LoginSchema, RegisterSchema, CreateProfessorSchema, NewsSchema, RoomSchema, AttendanceSchema, LabReservationSchema, ClassNoticeSchema, GradeSchema, CampusEventSchema, EventCheckInSchema, EventQrTokenSchema, SubjectAssessmentSchema, ClassAttendanceSchema, AssignmentSchema, AssignmentCompletionSchema } from './schemas.js';
import {
  addQueueTicket,
  createAttendance,
  createClassNotice,
  createLabReservation,
  createNews,
  createRoom,
  createUser,
  deleteClassNotice,
  deleteLabReservation,
  deleteNews,
  deleteRoom,
  getAttendanceByClass,
  getClassNoticesByClass,
  createAssignment,
  getAssignmentsByProfessor,
  getAssignmentsByStudent,
  getAssignmentById,
  setAssignmentCompleted,
  createAssignmentSubmissionFiles,
  getAssignmentSubmissionFilesForProfessor,
  getAssignmentSubmissionFile,
  getLabReservationsByProfessor,
  getNews,
  getQueueSectors,
  getRooms,
  getUsersByRole,
  findUserByEmail,
  getSubjects,
  getGrades,
  updateAttendance,
  updateNews,
  updateRoom,
  createGrade,
  updateGrade,
  createCampusEvent,
  getCampusEventsByProfessor,
  getCampusEventById,
  getEventByQrToken,
  getEventAttendanceRecord,
  createEventQrToken,
  markEventQrTokenUsed,
  recordEventCheckIn,
  getEventAttendanceForStudent,
  getSubjectAssessments,
  saveSubjectAssessment,
  getClassAttendance,
  getStudentAttendance,
  saveClassAttendanceRecord,
  findUserById,
} from './dbHelpers.js';
import { generateId, generateNewsId, generateRoomId, generateUserId, hashPassword, sanitizeUser, verifyPassword } from './utils.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4001);
const JWT_SECRET = process.env.JWT_SECRET ?? (
  process.env.NODE_ENV === 'production' ? '' : 'campus-news-dev-secret'
);
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
const MAX_ASSIGNMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ASSIGNMENT_FILES = 5;
const assignmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ASSIGNMENT_FILE_SIZE, files: MAX_ASSIGNMENT_FILES },
});

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
  const user = findUserByEmail(username) as any;

  const passwordMatches = user && (user.password === password || await verifyPassword(password, user.password));
  if (!passwordMatches) {
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

app.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const { name, email, password } = parsed.data;
  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
  }

  const user = createUser({
    id: generateUserId(),
    name,
    role: 'aluno',
    email,
    password: await hashPassword(password),
  });
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email },
  });
}));

app.get('/api/admin/professors', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  return res.json(getUsersByRole('professor'));
});

app.post('/api/admin/professors', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateProfessorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const { name, email, password } = parsed.data;
  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
  }

  const user = createUser({
    id: generateUserId(),
    name,
    role: 'professor',
    email,
    password: await hashPassword(password),
  });

  return res.status(201).json({ id: user.id, name: user.name, role: user.role, email: user.email });
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

app.get('/api/subjects', (_req, res) => {
  res.json(getSubjects());
});

app.get('/api/grades', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  const grades = user && user.role === 'aluno' ? getGrades(user.id) : getGrades();
  return res.json(grades);
});

app.get('/api/attendance/students', authMiddleware, professorMiddleware, (_req: Request, res: Response) =>
  res.json(getUsersByRole('aluno'))
);

app.get('/api/attendance/student-history', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role !== 'aluno') return res.status(403).json({ message: 'Acesso restrito a alunos.' });
  return res.json(getStudentAttendance(user.id));
});

app.get('/api/attendance/class/:subjectId', authMiddleware, professorMiddleware, (req: Request, res: Response) =>
  res.json(getClassAttendance(req.params.subjectId))
);

app.post('/api/attendance/session', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = ClassAttendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados da chamada inválidos.', errors: parsed.error.errors });

  const user = (req as Request & { user?: any }).user;
  const subject = getSubjects().find((item: any) => item.id === parsed.data.subjectId);
  if (!subject) return res.status(404).json({ message: 'Matéria não encontrada.' });

  for (const record of parsed.data.records) {
    const student = findUserById(record.studentId);
    if (!student || student.role !== 'aluno') continue;
    saveClassAttendanceRecord({
      id: generateId(), studentId: student.id, studentName: student.name,
      subjectId: subject.id, date: parsed.data.date, status: record.status, professorId: user.id,
    });
  }
  return res.json(getClassAttendance(subject.id));
}));

app.get('/api/subject-assessments', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  return res.json(user.role === 'aluno' ? getSubjectAssessments(user.id) : getSubjectAssessments());
});

app.put('/api/subject-assessments', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = SubjectAssessmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados da avaliação inválidos.', errors: parsed.error.errors });

  const student = findUserById(parsed.data.studentId);
  const subject = getSubjects().find((item: any) => item.id === parsed.data.subjectId);
  if (!student || student.role !== 'aluno') return res.status(404).json({ message: 'Aluno não encontrado.' });
  if (!subject) return res.status(404).json({ message: 'Matéria não encontrada.' });

  const user = (req as Request & { user?: any }).user;
  const assessmentData = parsed.data as {
    studentId: string;
    subjectId: string;
    assessmentType: 'N1' | 'N2' | 'Trabalho' | 'Exame';
    period: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre';
    value: number;
  };
  const assessment = saveSubjectAssessment({
    id: generateId(), ...assessmentData, studentName: student.name, subjectName: subject.name,
    professorId: user.id, updatedAt: new Date().toISOString(),
  });
  return res.json(assessment);
}));

app.post('/api/grades', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = GradeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const id = `grade-${Date.now()}`;
  const grade = createGrade({ id, ...parsed.data });
  return res.status(201).json(grade);
}));

app.put('/api/grades/:id', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = GradeSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validação falhou', errors: parsed.error.errors });
  }

  const updated = updateGrade(id, parsed.data);
  if (!updated) {
    return res.status(404).json({ message: 'Nota não encontrada.' });
  }

  return res.json(updated);
}));

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

app.get('/api/events', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  return res.json(getCampusEventsByProfessor(user.id));
});

app.post('/api/events/:eventId/qr', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = EventQrTokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Aluno ou tipo de QR inválido.' });

  const user = (req as Request & { user?: any }).user;
  const event = getCampusEventById(req.params.eventId);
  if (!event || event.professorId !== user.id) return res.status(404).json({ message: 'Evento não encontrado.' });
  const student = findUserById(parsed.data.studentId);
  if (!student || student.role !== 'aluno') return res.status(404).json({ message: 'Aluno não encontrado.' });

  const now = new Date();
  if (now < new Date(event.startsAt) || now > new Date(event.endsAt)) {
    return res.status(400).json({ message: 'O QR só pode ser gerado durante o horário do evento.' });
  }

  const existing = getEventAttendanceRecord(event.id, student.id);
  if (parsed.data.phase === 'entry' && existing?.checkedInAt) return res.status(409).json({ message: 'A entrada deste aluno já foi registrada.' });
  if (parsed.data.phase === 'exit' && !existing?.checkedInAt) return res.status(409).json({ message: 'Registre a entrada antes de gerar o QR de saída.' });
  if (parsed.data.phase === 'exit' && existing?.checkedOutAt) return res.status(409).json({ message: 'A saída deste aluno já foi registrada.' });

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + 2 * 60 * 1000).toISOString();
  createEventQrToken({ token, eventId: event.id, studentId: student.id, phase: parsed.data.phase, expiresAt, createdAt: now.toISOString() });
  return res.status(201).json({ token, phase: parsed.data.phase, studentName: student.name, expiresAt });
}));

app.post('/api/events', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = CampusEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados do evento inválidos.', errors: parsed.error.errors });
  }

  const user = (req as Request & { user?: any }).user;
  const eventData = parsed.data as { title: string; description: string; location: string; startsAt: string; endsAt: string };
  const event = createCampusEvent({
    id: generateId(),
    professorId: user.id,
    ...eventData,
    entryToken: randomBytes(32).toString('hex'),
    exitToken: randomBytes(32).toString('hex'),
    createdAt: new Date().toISOString(),
  });
  const { entryToken: _entryToken, exitToken: _exitToken, ...publicEvent } = event;
  return res.status(201).json(publicEvent);
}));

app.post('/api/events/confirm', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role !== 'aluno') {
    return res.status(403).json({ message: 'A confirmação de presença é exclusiva para alunos.' });
  }

  const parsed = EventCheckInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'QR code inválido.' });
  }

  const event = getEventByQrToken(parsed.data.token);
  if (!event) return res.status(404).json({ message: 'QR individual não encontrado ou expirado.' });
  if (event.tokenStudentId !== user.id) return res.status(403).json({ message: 'Este QR foi gerado para outro aluno.' });
  if (event.usedAt) return res.status(409).json({ message: 'Este QR já foi utilizado.' });

  const now = new Date();
  if (now > new Date(event.expiresAt)) return res.status(410).json({ message: 'Este QR expirou. Peça ao professor para gerar outro.' });
  if (now < new Date(event.startsAt) || now > new Date(event.endsAt)) {
    return res.status(400).json({ message: 'Este evento não está dentro do período de confirmação.' });
  }

  const existing = getEventAttendanceRecord(event.id, user.id);
  if (event.phase === 'entry' && existing?.checkedInAt) return res.status(409).json({ message: 'Sua entrada já foi confirmada.' });
  if (event.phase === 'exit' && !existing?.checkedInAt) return res.status(409).json({ message: 'A entrada precisa ser confirmada primeiro.' });
  if (event.phase === 'exit' && existing?.checkedOutAt) return res.status(409).json({ message: 'Sua saída já foi confirmada.' });

  if (!markEventQrTokenUsed(parsed.data.token, now.toISOString())) {
    return res.status(409).json({ message: 'Este QR já foi utilizado. Peça ao professor para gerar outro.' });
  }

  const attendance = recordEventCheckIn({
    id: generateId(),
    eventId: event.id,
    studentId: user.id,
    studentName: user.name,
    phase: event.phase,
    timestamp: now.toISOString(),
  });

  if (!attendance) {
    return res.status(409).json({ message: 'Registre a entrada antes de confirmar a saída.' });
  }

  return res.json({ event: { id: event.id, title: event.title, location: event.location }, attendance });
}));

app.get('/api/events/my-attendance', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role !== 'aluno') {
    return res.status(403).json({ message: 'Acesso restrito a alunos.' });
  }
  return res.json(getEventAttendanceForStudent(user.id));
});

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

app.get('/api/assignments', authMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role === 'aluno') return res.json(getAssignmentsByStudent(user.id));
  if (user.role === 'professor') return res.json(getAssignmentsByProfessor(user.id));
  return res.status(403).json({ message: 'Acesso restrito a alunos e professores.' });
});

app.post('/api/assignments', authMiddleware, professorMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const parsed = AssignmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados do trabalho inválidos.', errors: parsed.error.errors });

  const subject = getSubjects().find((item: any) => item.id === parsed.data.subjectId);
  if (!subject) return res.status(404).json({ message: 'Matéria não encontrada.' });
  const user = (req as Request & { user?: any }).user;
  const assignment = createAssignment({
    id: generateId(), ...parsed.data, subjectName: subject.name,
    professorId: user.id, createdAt: new Date().toISOString(),
  });
  return res.status(201).json(assignment);
}));

app.put('/api/assignments/:id/completion', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role !== 'aluno') return res.status(403).json({ message: 'Somente alunos podem atualizar seus trabalhos.' });
  const parsed = AssignmentCompletionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Estado do trabalho inválido.' });
  if (!getAssignmentById(req.params.id)) return res.status(404).json({ message: 'Trabalho não encontrado.' });

  const updated = setAssignmentCompleted({
    id: generateId(), assignmentId: req.params.id, studentId: user.id,
    completedAt: parsed.data.completed ? new Date().toISOString() : null,
  });
  return res.json(updated);
}));

const getAssignmentStorage = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError(503, 'O armazenamento de arquivos ainda não foi configurado no servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey).storage.from(process.env.SUPABASE_ASSIGNMENTS_BUCKET || 'assignment-submissions');
};

const allowedAssignmentFileTypes: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
};

app.get('/api/assignments/submissions', authMiddleware, professorMiddleware, (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  return res.json(getAssignmentSubmissionFilesForProfessor(user.id));
});

app.post('/api/assignments/:id/submissions', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user?: any }).user;
  if (user.role !== 'aluno') return res.status(403).json({ message: 'Somente alunos podem enviar arquivos.' });
  return assignmentUpload.array('files', MAX_ASSIGNMENT_FILES)(req, res, next);
}, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  const assignment = getAssignmentById(req.params.id);
  if (!assignment) throw new ApiError(404, 'Trabalho não encontrado.');

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, 'Selecione ao menos um arquivo para enviar.');
  for (const file of files) {
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    const acceptedMimeTypes = allowedAssignmentFileTypes[extension];
    if (!acceptedMimeTypes || (file.mimetype !== 'application/octet-stream' && !acceptedMimeTypes.includes(file.mimetype))) {
      throw new ApiError(400, 'Formato não aceito. Envie PDF, DOC/DOCX, XLS/XLSX ou uma imagem.');
    }
    if (!file.size) throw new ApiError(400, 'Não é possível enviar arquivos vazios.');
  }

  const bucket = getAssignmentStorage();
  const uploadedPaths: string[] = [];
  const uploadedAt = new Date().toISOString();
  const fileRecords = files.map(file => {
    const id = generateId();
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    return {
      id,
      assignmentId: assignment.id,
      studentId: user.id,
      fileName: file.originalname,
      storagePath: `${assignment.id}/${user.id}/${id}${extension}`,
      mimeType: file.mimetype || 'application/octet-stream',
      fileSize: file.size,
      uploadedAt,
      buffer: file.buffer,
    };
  });

  try {
    for (const file of fileRecords) {
      const { error } = await bucket.upload(file.storagePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });
      if (error) throw new ApiError(502, `Não foi possível salvar o arquivo ${file.fileName}: ${error.message}`);
      uploadedPaths.push(file.storagePath);
    }

    const savedFiles = createAssignmentSubmissionFiles(
      fileRecords.map(({ buffer: _buffer, ...record }) => record),
      { id: generateId(), assignmentId: assignment.id, studentId: user.id, completedAt: uploadedAt },
    );
    return res.status(201).json(savedFiles);
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await bucket.remove(uploadedPaths);
      if (cleanupError) {
        console.error('[Assignment upload cleanup]', cleanupError);
        throw new ApiError(500, 'O envio falhou e alguns arquivos temporários não puderam ser removidos. Contate o suporte.');
      }
    }
    throw error;
  }
}));

app.get('/api/assignments/:id/submissions/:fileId/download', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: any }).user;
  const file = getAssignmentSubmissionFile(req.params.fileId);
  if (!file || file.assignmentId !== req.params.id) throw new ApiError(404, 'Arquivo não encontrado.');
  const assignment = getAssignmentById(req.params.id);
  const canDownload = user.role === 'aluno'
    ? file.studentId === user.id
    : user.role === 'professor' && assignment?.professorId === user.id;
  if (!canDownload) throw new ApiError(403, 'Você não tem permissão para acessar este arquivo.');

  const { data, error } = await getAssignmentStorage().createSignedUrl(file.storagePath, 60);
  if (error) throw new ApiError(502, `Não foi possível abrir o arquivo: ${error.message}`);
  return res.json({ url: data.signedUrl });
}));

const webDirectory = resolve(process.cwd(), 'dist');
if (existsSync(webDirectory)) {
  app.use(express.static(webDirectory));
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();
    return res.sendFile(resolve(webDirectory, 'index.html'), next);
  });
}

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
