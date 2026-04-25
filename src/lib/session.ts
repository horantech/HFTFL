import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type Session = {
  loggedIn?: boolean;
  loginAt?: number;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "dev-secret-please-replace-at-least-32-chars-long-xxx",
  cookieName: "hftfl_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  },
};

export async function getSession() {
  const store = await cookies();
  return getIronSession<Session>(store, sessionOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.loggedIn) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
