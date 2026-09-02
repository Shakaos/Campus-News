import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateNewsId = (): string => generateId();
export const generateRoomId = (): string => generateId();
export const generateUserId = (): string => generateId();
export const generateTicketId = (): string => generateId();
export const generateAttendanceId = (): string => generateId();
export const generateLabReservationId = (): string => generateId();
export const generateClassNoticeId = (): string => generateId();

// Validar se é um email válido
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Limpar dados sensíveis
export const sanitizeUser = (user: any) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
