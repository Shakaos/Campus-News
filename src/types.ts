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
  courseId?: string | null;
  courseName?: string | null;
  coursePeriod?: number | null;
  classGroup?: string | null;
}

export interface AcademicCourse {
  id: string;
  name: string;
}

export interface CourseSubject {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  workload: number;
  credits: number;
  courseId: string;
  courseName: string;
  coursePeriod: number;
  academicTerm: string;
  classGroup: string;
  professorId: string;
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

export interface SubjectPerformanceDetails {
  subjectId: string;
  n1: number | null;
  n2: number | null;
  exam: number | null;
  assignment: number | null;
  absences: number;
  totalClasses: number;
}

export type AssessmentType = 'N1' | 'N2' | 'Trabalho' | 'Exame';
export type AttendanceStatus = 'presente' | 'ausente' | 'atraso';

export interface SubjectAssessmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  assessmentType: AssessmentType;
  period: GradeRecord['period'];
  value: number;
  professorId: string;
  updatedAt: string;
}

export interface ClassAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  professorId: string;
}

export interface AssignmentRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  courseName?: string;
  coursePeriod?: number;
  classGroup?: string;
  academicTerm?: string;
  professorId: string;
  title: string;
  description: string;
  dueAt: string;
  createdAt: string;
  completedAt?: string | null;
  submissionFiles?: AssignmentSubmissionFile[];
}

export interface AssignmentSubmissionFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface AssignmentSubmissionNotice {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectName: string;
  courseName?: string;
  coursePeriod?: number;
  classGroup?: string;
  studentId: string;
  studentName: string;
  uploadedAt: string;
  files: AssignmentSubmissionFile[];
}

export type AppView = 'login' | 'home' | 'campus-news' | 'noticia' | 'salas' | 'filas' | 'acompanhamento' | 'admin' | 'professor-dashboard' | 'professor-attendance' | 'professor-lab' | 'professor-notices' | 'professor-reports' | 'professor-grades' | 'professor-events' | 'professor-assignments' | 'student-events' | 'student-schedule' | 'student-assignments' | 'event-checkin' | 'student-performance';
