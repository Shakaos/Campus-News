import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Cada arquivo pode ter no máximo 10 MB.' });
  }
  if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Envie no máximo 5 arquivos por trabalho.' });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validação falhou',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
