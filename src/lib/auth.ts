import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const allowedUsers = ["admin"] as const;
export type Username = (typeof allowedUsers)[number];

const cookieName = "fritterflix_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function isAllowedUser(username: string): username is Username {
  return (allowedUsers as readonly string[]).includes(username);
}

export function passwordFor(username: Username) {
  if (username === "admin") return process.env.FRITTERFLIX_ADMIN_PASSWORD;
}

export function verifyPassword(username: Username, password: string) {
  const expected = passwordFor(username);
  if (!expected) return false;
  // TODO: hash passwords if Fritterflix ever opens beyond fritter.lol.
  return password === expected;
}

export function createSessionCookie(username: Username) {
  const issuedAt = Date.now();
  const payload = Buffer.from(JSON.stringify({ username, issuedAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value?: string | null): Username | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof parsed.username === "string" && isAllowedUser(parsed.username) ? parsed.username : null;
  } catch {
    return null;
  }
}

export async function currentUser() {
  const jar = await cookies();
  const username = readSessionValue(jar.get(cookieName)?.value);
  if (!username) return null;
  return username;
}

export async function setSession(username: Username) {
  await prisma.user.upsert({
    where: { username },
    create: { id: username, username },
    update: {}
  });

  const jar = await cookies();
  jar.set(cookieName, createSessionCookie(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(cookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
