import { NextFunction, Request, Response } from 'express';
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

async function refreshSession(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session || !data.user) {
    return null;
  }

  res.cookie(ACCESS_COOKIE, data.session.access_token, {
    ...cookieOptions(),
    maxAge: data.session.expires_in * 1000,
  });

  res.cookie(REFRESH_COOKIE, data.session.refresh_token, {
    ...cookieOptions(),
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return data.user;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies?.[ACCESS_COOKIE];

    if (accessToken) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (!error && data.user) {
        res.locals.authUser = data.user;
        return next();
      }
    }

    const refreshedUser = await refreshSession(req, res);

    if (refreshedUser) {
      res.locals.authUser = refreshedUser;
      return next();
    }

    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  } catch (error) {
    return next(error);
  }
}
