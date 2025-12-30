import { cookies } from "next/headers";

export type AppRole = "seller" | "admin";

export type AppUser = {
  role: AppRole;
  sellerId?: number;
  sellerName: string;
};

export async function getServerSession(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("app_user")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as any;

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

    return {
      role: "admin",
      sellerName: String(parsed.sellerName),
    };
  } catch {
    return null;
  }
}
