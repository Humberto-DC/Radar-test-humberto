//lib\whatsapp.ts

export function normalizePhoneBR(phone: string) {
  // remove tudo que não for número
  const digits = phone.replace(/\D/g, "");

  // se já tem DDI (55...), mantém; senão adiciona
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const p = normalizePhoneBR(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${p}?text=${text}`;
}
