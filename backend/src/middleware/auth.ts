import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.',
    });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
      req.user = decoded;
    } catch {
      // Ignore invalid optional tokens
    }
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access forbidden: Admin privilege required',
    });
    return;
  }
  next();
}
