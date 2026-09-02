import { describe, it, expect } from 'vitest';
import { LoginSchema, NewsSchema, RoomSchema } from '../server/schemas';

describe('Validation Schemas', () => {
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
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const data = {
        title: 'abc',
        category: 'evento',
        summary: 'Uma semana dedicada a tecnologia',
        content: 'Conteúdo detalhado sobre a semana de tecnologia com informações completas',
      };
      const result = NewsSchema.safeParse(data);
      expect(result.success).toBe(false);
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
});
