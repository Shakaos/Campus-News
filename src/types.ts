export interface NewsItem {
  id: string;
  title: string;
  category: 'urgente' | 'evento' | 'aviso';
  summary: string;
  content: string;
  date: string;
  imageUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  status: 'disponível' | 'ocupada' | 'manutenção';
  currentProfessor?: string;
  nextClass?: string;
  capacity: number;
}

export interface QueueSector {
  id: string;
  name: string;
  description: string;
  currentNumber: number;
  waitingCount: number;
  averageServiceTime: number; // in minutes
}

export interface QueueTicket {
  id: string;
  sectorId: string;
  number: number;
  position: number;
  estimatedTime: number; // in minutes
  timestamp: string;
}

export type Role = 'aluno' | 'professor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export interface CourseSubject {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  workload: number;
  credits: number;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  value: number;
  period: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre';
  status: 'Aprovado' | 'Recuperação' | 'Reprovado';
}

export type AppView = 'login' | 'home' | 'campus-news' | 'noticia' | 'salas' | 'filas' | 'acompanhamento' | 'admin' | 'professor-dashboard' | 'professor-attendance' | 'professor-lab' | 'professor-notices' | 'professor-reports' | 'professor-grades' | 'student-performance';
