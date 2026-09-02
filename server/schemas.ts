import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const NewsSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  category: z.enum(['urgente', 'evento', 'aviso']),
  summary: z.string().min(10, 'Resumo deve ter pelo menos 10 caracteres'),
  content: z.string().min(20, 'Conteúdo deve ter pelo menos 20 caracteres'),
  date: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
});

export const RoomSchema = z.object({
  name: z.string().min(2),
  building: z.string().min(1),
  floor: z.string().min(1),
  status: z.enum(['disponível', 'ocupada', 'manutenção']),
  currentProfessor: z.string().optional(),
  nextClass: z.string().optional(),
  capacity: z.number().positive(),
});

export const AttendanceSchema = z.object({
  studentName: z.string().min(2),
  status: z.enum(['presente', 'ausente', 'atraso']),
  classId: z.string(),
  date: z.string().datetime().optional(),
});

export const LabReservationSchema = z.object({
  labName: z.string().min(2),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().min(5),
  professorId: z.string(),
});

export const ClassNoticeSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  classId: z.string(),
  date: z.string().datetime().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type NewsInput = z.infer<typeof NewsSchema>;
export type RoomInput = z.infer<typeof RoomSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type LabReservationInput = z.infer<typeof LabReservationSchema>;
export type ClassNoticeInput = z.infer<typeof ClassNoticeSchema>;
