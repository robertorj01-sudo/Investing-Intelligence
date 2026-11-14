import { NextFunction, Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/repository.ts';

export interface AuthRequest extends Request {
  firebaseUser?: DecodedIdToken;
  dbUser?: Awaited<ReturnType<typeof getOrCreateUser>>;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação necessária. Faça login para continuar.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.firebaseUser = decodedToken;
    req.dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@investintelligence.app`,
      decodedToken.name
    );
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.firebaseUser = decodedToken;
      req.dbUser = await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || `${decodedToken.uid}@investintelligence.app`,
        decodedToken.name
      );
    } catch {
      // Optional auth ignores expired/invalid tokens gracefully
    }
  }
  next();
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  if (req.dbUser.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
};
