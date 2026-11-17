import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import type { UserRole } from '../src/types/index';

const RUNTIME_JWT_SECRET =
  process.env.JWT_SECRET ||
  crypto.createHash('sha256').update(`lumi-store-dev-${process.cwd()}`).digest('hex');

const JWT_EXPIRES_IN = '7d';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    first_name: string;
    last_name: string;
  };
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, RUNTIME_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, RUNTIME_JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function attachOptionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = getBearerToken(req);
  if (!token) {
    return next();
  }
  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return next();
  }
  const user = db
    .prepare('SELECT id, email, role, first_name, last_name FROM users WHERE id = ?')
    .get(decoded.userId) as AuthenticatedRequest['user'] | undefined;
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const decoded = verifyAuthToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Session expired or invalid token.' });
    return;
  }
  const user = db
    .prepare('SELECT id, email, role, first_name, last_name FROM users WHERE id = ?')
    .get(decoded.userId) as AuthenticatedRequest['user'] | undefined;
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Administrator access required.' });
    return;
  }
  next();
}
