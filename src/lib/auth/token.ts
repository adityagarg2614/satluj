import { SignJWT, jwtVerify } from "jose";

import { getRequiredEnv } from "@/lib/env";

export const SESSION_COOKIE_NAME = "satluj-admin-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey() {
  return new TextEncoder().encode(getRequiredEnv("AUTH_SECRET"));
}

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
};

export async function createSessionToken(session: AdminSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload as unknown as AdminSession;
}

export { SESSION_DURATION_SECONDS };
