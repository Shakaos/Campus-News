import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const CreateProfessorSchema = RegisterSchema;

const OptionalDateString = z.union([
  z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida'),
  z.literal(''),
]).optional();

const OptionalImageUrl = z.union([
  z.string().url(),
  z.literal(''),
]).optional();

export const NewsSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.enum(['urgente', 'evento', 'aviso']),
  summary: z.string().min(1, 'Resumo é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  date: OptionalDateString,
  imageUrl: OptionalImageUrl,
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

export const SubjectAssessmentSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  assessmentType: z.enum(['N1', 'N2', 'Trabalho', 'Exame']),
  period: z.enum(['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre']),
  value: z.number().min(0).max(10),
});

export const ClassAttendanceSchema = z.object({
  subjectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['presente', 'ausente', 'atraso']),
  })).min(1),
});

export const AssignmentSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(3).max(2000),
  dueAt: z.string().datetime(),
});

export const AssignmentCompletionSchema = z.object({
  completed: z.boolean(),
});

export const CampusEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(1000),
  location: z.string().trim().min(2).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
}).refine((event) => new Date(event.endsAt) > new Date(event.startsAt), {
  message: 'O término deve ser posterior ao início.',
  path: ['endsAt'],
});

export const EventCheckInSchema = z.object({
  token: z.string().min(32).max(128),
});

export const EventQrTokenSchema = z.object({
  studentId: z.string().min(1),
  phase: z.enum(['entry', 'exit']),
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

export const GradeSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(2),
  subjectId: z.string().min(1),
  subjectName: z.string().min(2),
  value: z.number().min(0).max(10),
  period: z.enum(['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre']),
  status: z.enum(['Aprovado', 'Recuperação', 'Reprovado']),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateProfessorInput = z.infer<typeof CreateProfessorSchema>;
export type NewsInput = z.infer<typeof NewsSchema>;
export type RoomInput = z.infer<typeof RoomSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type CampusEventInput = z.infer<typeof CampusEventSchema>;
export type LabReservationInput = z.infer<typeof LabReservationSchema>;
export type ClassNoticeInput = z.infer<typeof ClassNoticeSchema>;
export type GradeInput = z.infer<typeof GradeSchema>;
