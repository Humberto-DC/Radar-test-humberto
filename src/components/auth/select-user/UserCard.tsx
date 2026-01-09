// components/auth/select-user/UserCard.tsx
"use client";

import { Shield, CircleUserRound } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function UserCard({
  title,
  subtitle,
  badge,
  variant = "seller",
  onClick,
}: {
  title: string;
  subtitle: string;
  badge: string;
  variant?: "seller" | "admin";
  onClick: () => void;
}) {
  const Icon = variant === "admin" ? Shield : CircleUserRound;

  return (
    <button
      onClick={onClick}
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white p-6 text-center shadow-sm",
        "border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2323ff] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      {/* highlight hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#2323ff]/5" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#b6f01f]/40" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* avatar */}
        <ProfileAvatar
          name={variant === "admin" ? undefined : title}
          size={64}
          className={[
            "bg-gray-100 text-[#2323ff]",
            variant === "admin" ? "bg-[#2323ff]/10 text-[#2323ff]" : "",
          ].join(" ")}
          fallback={<Icon size={60} strokeWidth={1} className="text-[#b6f01f]" />}
        />

        {/* nome */}
        <div className="mt-4 text-xl font-semibold text-gray-900">{title}</div>

        {/* badge */}
        <div className="mt-2">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              variant === "admin"
                ? "bg-[#b6f01f] text-white"
                : "bg-gray-100 text-gray-700",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>

        {/* subtitle */}
        <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
}
