"use client";

import { useEffect, useMemo, useState } from "react";

function normalizePhotoKey(name?: string) {
  const cleaned = (name ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();

  // remove "GRUPO " do começo (se tiver)
  const noGrupo = cleaned.startsWith("GRUPO ")
    ? cleaned.slice("GRUPO ".length)
    : cleaned;

  const parts = noGrupo.split(" ").filter(Boolean);
  if (parts.length === 0) return "";

  const STOP = new Set(["DA", "DE", "DO", "DAS", "DOS", "E"]);

  const first = parts[0];

  // pega o "primeiro sobrenome válido" (ignorando DA/DE/DO...)
  const surname = parts.slice(1).find((p) => !STOP.has(p)) ?? "";

  return surname ? `${first}_${surname}` : first;
}



const EXTS = ["png", "jpg", "jpeg"] as const;

export default function ProfileAvatar({
  name,
  size = 35,
  className = "",
  fallback,
}: {
  name?: string;
  size?: number;
  className?: string;
  fallback: React.ReactNode;
}) {
  const key = useMemo(() => normalizePhotoKey(name), [name]);

  const [approvedSrc, setApprovedSrc] = useState<string | null>(null);
  const [tryIndex, setTryIndex] = useState(0);

  useEffect(() => {
    setApprovedSrc(null);
    setTryIndex(0);
  }, [key]);

  const tryingSrc = useMemo(() => {
    if (!key) return null;
    const ext = EXTS[tryIndex];
    return `/fotos/${key}.${ext}`;
  }, [key, tryIndex]);

  useEffect(() => {
    if (!tryingSrc || approvedSrc) return;

    const img = new Image();
    img.src = tryingSrc;

    img.onload = () => setApprovedSrc(tryingSrc);
    img.onerror = () => {
      if (tryIndex < EXTS.length - 1) setTryIndex((i) => i + 1);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [tryingSrc, approvedSrc, tryIndex]);

  if (!approvedSrc) {
    return (
      <div
        className={[
          "flex items-center justify-center rounded-full overflow-hidden bg-white/10",
          className,
        ].join(" ")}
        style={{ width: size, height: size }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={approvedSrc}
      alt={name ?? "Perfil"}
      draggable={false}
      className={["rounded-full object-cover", className].join(" ")}
      style={{ width: size, height: size }}
    />
  );
}
{/* <div
  className="rounded-full overflow-hidden flex items-center justify-center"
  style={{
    width: size,
    height: size,
  }}
>
  <img
    src={approvedSrc}
    alt={name ?? "Perfil"}
    draggable={false}
    className="h-full w-full object-cover"
    style={{
      transform: "scale(1.45)",
      transformOrigin: "center top",
      objectPosition: "50% 18%",
      display: "block",
    }}
  />
</div> */}
