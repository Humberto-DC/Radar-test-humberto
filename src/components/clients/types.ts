// components/clients/types.ts

// Tipo simplificado para a tela de clientes
export type AdminClient = {
  id_cliente: number;
  Cliente: string;
  Cidade: string;
  Vendedor: string;
  Limite: number;
  ativo: boolean;
};
