// components/history/types.ts
export type HistoryRow = {
  id_envio: string; // id do registro
  id_cliente: number;
  to_phone: string;
  status_entrega: string; // sent | delivered | read | failed | ...
  data_envio: string;     // ISO date
  mensagens?: { titulo: string };
  clientes?: { nome: string; telefone: string };
};
