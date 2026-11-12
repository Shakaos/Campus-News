import { describe, it, expect } from 'vitest';
import { AcademicCourseSchema, AcademicSubjectSchema, AcademicTermSchema, AssignmentCompletionSchema, AssignmentSchema, CampusEventSchema, ClassAttendanceSchema, CreateStudentSchema, EventQrTokenSchema, LoginSchema, NewsSchema, RoomSchema, SubjectAssessmentSchema } from '../server/schemas';

describe('Validation Schemas', () => {
  describe('Academic setup', () => {
    it('requires course, academic period, and class group when creating a student', () => {
      const student = {
        name: 'André Silva',
        email: 'andre@example.edu',
        password: 'student123',
        courseId: 'systems',
        coursePeriod: 3,
        classGroup: 'A',
      };
      expect(CreateStudentSchema.safeParse(student).success).toBe(true);
      expect(CreateStudentSchema.safeParse({ ...student, coursePeriod: 0 }).success).toBe(false);
      expect(CreateStudentSchema.safeParse({
        name: student.name, email: student.email, password: student.password,
        courseId: student.courseId, classGroup: student.classGroup,
      }).success).toBe(false);
    });

    it('validates course names and academic term format', () => {
      expect(AcademicCourseSchema.safeParse({ name: 'Sistemas de Informação' }).success).toBe(true);
      expect(AcademicTermSchema.safeParse({ term: '2026/2' }).success).toBe(true);
      expect(AcademicTermSchema.safeParse({ term: '2026-2' }).success).toBe(false);
    });

    it('requires a valid course period and assigned professor for a class offering', () => {
      const offering = {
        name: 'Banco de Dados',
        courseId: 'systems',
        coursePeriod: 3,
        classGroup: 'A',
        professorId: 'professor-1',
        schedule: 'Seg e Qua · 08:00',
        workload: 60,
        credits: 3,
      };
      expect(AcademicSubjectSchema.safeParse(offering).success).toBe(true);
      expect(AcademicSubjectSchema.safeParse({ ...offering, coursePeriod: 13 }).success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const data = { username: 'admin@campus.edu', password: 'admin123' };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject short username', () => {
      const data = { username: 'ab', password: 'admin123' };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const data = { username: 'admin@campus.edu', password: '123' };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('NewsSchema', () => {
    it('should validate correct news data', () => {
      const data = {
        title: 'Semana de Tecnologia',
        category: 'evento',
        summary: 'Uma semana dedicada a tecnologia',
        content: 'Conteúdo detalhado sobre a semana de tecnologia com informações completas',
        date: '2026-09-10',
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty imageUrl when editing a news item', () => {
      const data = {
        title: 'Semana de Tecnologia',
        category: 'evento',
        summary: 'Uma semana dedicada a tecnologia',
        content: 'Conteúdo detalhado sobre a semana de tecnologia com informações completas',
        date: '2026-09-10',
        imageUrl: '',
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept brief admin news text', () => {
      const data = {
        title: 'xcasd',
        category: 'evento',
        summary: 'xcasd',
        content: 'dfsdf',
        date: '2026-09-10',
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const data = {
        title: 'Semana de Tecnologia',
        category: 'invalid',
        summary: 'Uma semana dedicada a tecnologia',
        content: 'Conteúdo detalhado sobre a semana de tecnologia com informações completas',
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('RoomSchema', () => {
    it('should validate correct room data', () => {
      const data = {
        name: 'Sala 101',
        building: 'Bloco A',
        floor: 'Térreo',
        status: 'disponível',
        capacity: 30,
      };
      const result = RoomSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const data = {
        name: 'Sala 101',
        building: 'Bloco A',
        floor: 'Térreo',
        status: 'invalido',
        capacity: 30,
      };
      const result = RoomSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject zero capacity', () => {
      const data = {
        name: 'Sala 101',
        building: 'Bloco A',
        floor: 'Térreo',
        status: 'disponível',
        capacity: 0,
      };
      const result = RoomSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CampusEventSchema', () => {
    const validEvent = {
      title: 'Palestra de tecnologia',
      description: 'Tendências de tecnologia no campus',
      location: 'Auditório Central',
      startsAt: '2026-10-21T14:00:00.000Z',
      endsAt: '2026-10-21T16:00:00.000Z',
    };

    it('should accept an event with a valid date range', () => {
      expect(CampusEventSchema.safeParse(validEvent).success).toBe(true);
    });

    it('should reject an event that ends before it starts', () => {
      expect(CampusEventSchema.safeParse({ ...validEvent, endsAt: '2026-10-21T13:00:00.000Z' }).success).toBe(false);
    });
  });

  describe('Academic records', () => {
    it('accepts an assessment grade from 0 to 10', () => {
      expect(SubjectAssessmentSchema.safeParse({
        studentId: 'student-1',
        subjectId: 'alg',
        assessmentType: 'N1',
        period: '1º Bimestre',
        value: 8.5,
      }).success).toBe(true);
    });

    it('rejects assessment grades outside the allowed range', () => {
      expect(SubjectAssessmentSchema.safeParse({
        studentId: 'student-1',
        subjectId: 'alg',
        assessmentType: 'N2',
        period: '1º Bimestre',
        value: 11,
      }).success).toBe(false);
    });

    it('accepts per-student attendance for a class date', () => {
      expect(ClassAttendanceSchema.safeParse({
        subjectId: 'alg',
        date: '2026-10-21',
        records: [{ studentId: 'student-1', status: 'ausente' }],
      }).success).toBe(true);
    });
  });

  describe('Event QR tokens', () => {
    it('requires an individual student and a valid phase', () => {
      expect(EventQrTokenSchema.safeParse({ studentId: 'student-1', phase: 'entry' }).success).toBe(true);
      expect(EventQrTokenSchema.safeParse({ studentId: 'student-1', phase: 'other' }).success).toBe(false);
    });
  });

  describe('Assignments', () => {
    it('accepts a work item with a due date', () => {
      expect(AssignmentSchema.safeParse({
        subjectId: 'alg',
        title: 'Lista de exercícios',
        description: 'Resolver as questões 1 a 10.',
        dueAt: '2026-10-22T23:59:00.000Z',
      }).success).toBe(true);
    });

    it('rejects an invalid work completion state', () => {
      expect(AssignmentCompletionSchema.safeParse({ completed: 'sim' }).success).toBe(false);
    });
  });
});
