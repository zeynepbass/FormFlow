import { Router } from 'express';
import { requireAuth } from '../../common/middleware/require-auth.js';
import { parse } from '../../common/validation/parse.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from './auth.schemas.js';
import * as authService from './auth.service.js';
import { SESSION_COOKIE, clearSessionCookie, deleteSession, setSessionCookie } from './session.js';

export function authRoutes(limiters) {
  const router = Router();

  router.post('/register', limiters.register, async (req, res) => {
    const input = parse(registerSchema, req.body);
    const { user, session } = await authService.register(input);
    setSessionCookie(res, session.token, session.session.expiresAt);
    res.status(201).json({ data: authService.toUserDto(user) });
  });

  router.post('/login', limiters.loginByIp, limiters.loginByEmail, async (req, res) => {
    const input = parse(loginSchema, req.body);
    const { user, session } = await authService.login(input);
    setSessionCookie(res, session.token, session.session.expiresAt);
    res.json({ data: authService.toUserDto(user) });
  });

  router.post('/logout', async (req, res) => {
    await deleteSession(req.cookies?.[SESSION_COOKIE]);
    clearSessionCookie(res);
    res.status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    res.set('cache-control', 'private, no-store');
    res.json({ data: authService.toUserDto(req.user) });
  });

  router.post('/verify-email', async (req, res) => {
    const { token } = parse(tokenSchema, req.body);
    await authService.verifyEmail(token);
    res.json({ data: { verified: true } });
  });

  router.post('/resend-verification', limiters.passwordReset, requireAuth, async (req, res) => {
    await authService.resendVerification(req.user);
    res.status(202).json({ data: { sent: true } });
  });

  router.post('/forgot-password', limiters.passwordReset, async (req, res) => {
    const { email } = parse(forgotPasswordSchema, req.body);
    await authService.forgotPassword(email);
    res.status(202).json({
      data: { message: 'If an account exists for this email, a reset link is on its way.' },
    });
  });

  router.post('/reset-password', limiters.passwordReset, async (req, res) => {
    const input = parse(resetPasswordSchema, req.body);
    await authService.resetPassword(input);
    clearSessionCookie(res);
    res.json({ data: { reset: true } });
  });

  return router;
}
