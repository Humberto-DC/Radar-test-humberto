import { cookies } from "next/headers";

export type AppRole = "seller" | "admin";

export type AppUser =
  | { role: "admin"; sellerName: string }
  | { role: "seller"; sellerId: number; sellerName: string };

const COOKIE_NAME = "app_user";

function isHttpsEnv() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;
  return Boolean(url && url.startsWith("https://"));
}

function encodeUser(user: AppUser) {
  return encodeURIComponent(JSON.stringify(user));
}

function decodeUser(raw: string): AppUser | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as any;

    if (!parsed?.role || !parsed?.sellerName) return null;

    if (parsed.role === "seller") {
      const sellerIdNum = Number(parsed.sellerId);
      if (!Number.isFinite(sellerIdNum)) return null;

      return {
        role: "seller",
        sellerId: sellerIdNum,
        sellerName: String(parsed.sellerName),
      };
    }

    if (parsed.role === "admin") {
      return {
        role: "admin",
        sellerName: String(parsed.sellerName),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AppUser | null> {
  const store = await cookies(); // ✅ await
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodeUser(raw);
}

export async function setServerSession(user: AppUser): Promise<void> {
  const store = await cookies(); // ✅ await
  const value = encodeUser(user);

  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsEnv(), // ✅ HTTP: false | HTTPS: true
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function clearServerSession(): Promise<void> {
  const store = await cookies(); // ✅ await
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsEnv(),
    path: "/",
    maxAge: 0,
  });
}
