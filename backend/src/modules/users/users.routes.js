import { Router } from 'express';
import { parse } from '../../common/validation/parse.js';
import { toUserDto } from '../auth/auth.service.js';
import { clearSessionCookie, setSessionCookie } from '../auth/session.js';
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from './users.schemas.js';
import * as usersService from './users.service.js';

export function usersRoutes() {
  const router = Router();

  router.patch('/me', async (req, res) => {
    const input = parse(updateProfileSchema, req.body);
    const user = await usersService.updateProfile(req.user._id, input);
    res.json({ data: toUserDto(user) });
  });

  router.patch('/me/password', async (req, res) => {
    const input = parse(changePasswordSchema, req.body);
    const { token, session } = await usersService.changePassword(req.user._id, input);
    setSessionCookie(res, token, session.expiresAt);
    res.json({ data: { updated: true } });
  });

  router.delete('/me', async (req, res) => {
    const input = parse(deleteAccountSchema, req.body);
    await usersService.deleteAccount(req.user._id, input);
    clearSessionCookie(res);
    res.status(204).end();
  });

  return router;
}
