const normalizePhone = (input) => {
  if (!input) return "";

  // Remove tudo que não é dígito
  let digits = input.replace(/\D/g, "");

  // Remove DDI 55 se já vier com ele
  if (digits.startsWith("55")) digits = digits.slice(2);

  // Agora digits deve ser algo como "61996246646" ou "6196246646"

  // Garante que tem DDD
  if (digits.length < 10) return ""; // número sem DDD → impossível normalizar

  const ddd = digits.slice(0, 2);
  let rest = digits.slice(2); // número sem DDD → ex: 996246646

  // Remove o 9 extra (se houver)
  // Caso típico no Brasil: DDD + 9 + número de 8 dígitos
  if (rest.length === 9 && rest.startsWith("9")) {
    rest = rest.slice(1);
  }

  // Agora deve sobrar exatamente 8 dígitos
  if (rest.length !== 8) {
    console.warn("[normalizePhone] Número inesperado:", input, digits);
    return "";
  }

  // Retorna no formato: 55 + DDD + número
  return `55${ddd}${rest}`;
};


console.log(normalizePhone("5561996246646"));
console.log(normalizePhone("61996246646"));
console.log(normalizePhone("(61) 99624-6646"));
console.log(normalizePhone("61 96246646"));
