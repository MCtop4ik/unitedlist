import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
export function errorHandler(error: any, req: Request, res: Response, _next: NextFunction) {
  void _next;
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Invalid request.' } });
    return;
  }
  const status = Number(error?.statusCode ?? 500);
  const code = error?.code ?? (status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR');
  const message = status >= 500 ? 'Unexpected server error.' : error?.message ?? 'Request failed.';
  if (status >= 500) req.log?.error?.({ err: error }, 'request failed');
  res.status(status).json({ error: { code, message, ...(error?.field ? { field: error.field } : {}) } });
}
