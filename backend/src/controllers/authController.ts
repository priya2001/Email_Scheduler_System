import { Request, Response, NextFunction } from 'express';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { createSupabaseServerClient } from '../lib/supabase';

const ACCESS_COOKIE = 'email_scheduler_access_token';
const REFRESH_COOKIE = 'email_scheduler_refresh_token';

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

function setAuthCookies(res: Response, session: Session) {
  res.cookie(ACCESS_COOKIE, session.access_token, {
    ...cookieOptions(),
    maxAge: session.expires_in * 1000,
  });

  res.cookie(REFRESH_COOKIE, session.refresh_token, {
    ...cookieOptions(),
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}

function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
  };
}

async function refreshSessionIfNeeded(req: Request, res: Response): Promise<{ session: Session; user: User } | null> {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (!refreshToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    return null;
  }

  setAuthCookies(res, data.session);
  return { session: data.session, user: data.user };
}

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password',
        });
      }

      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (data.session) {
        setAuthCookies(res, data.session);
      }

      return res.status(201).json({
        success: true,
        data: {
          user: data.user ? serializeUser(data.user) : null,
          session: data.session ? { expires_at: data.session.expires_at } : null,
          message: data.session
            ? 'Account created and signed in'
            : 'Account created. Please check your email to verify your account.',
        },
      });
    } catch (error) {
      logger.error('Signup failed', error);
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password',
        });
      }

      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        return res.status(401).json({
          success: false,
          error: error?.message || 'Invalid credentials',
        });
      }

      setAuthCookies(res, data.session);

      return res.status(200).json({
        success: true,
        data: {
          user: data.user ? serializeUser(data.user) : null,
          session: { expires_at: data.session.expires_at },
        },
      });
    } catch (error) {
      logger.error('Login failed', error);
      return next(error);
    }
  },

  async session(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.[ACCESS_COOKIE];

      if (!accessToken) {
        const refreshed = await refreshSessionIfNeeded(req, res);
        if (!refreshed) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            user: serializeUser(refreshed.user),
            session: { expires_at: refreshed.session.expires_at },
          },
        });
      }

      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        const refreshed = await refreshSessionIfNeeded(req, res);
        if (!refreshed) {
          clearAuthCookies(res);
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            user: serializeUser(refreshed.user),
            session: { expires_at: refreshed.session.expires_at },
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: serializeUser(data.user),
          session: null,
        },
      });
    } catch (error) {
      logger.error('Session lookup failed', error);
      return next(error);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: 'Logged out',
      });
    } catch (error) {
      logger.error('Logout failed', error);
      return next(error);
    }
  },
};
