// types/crm.ts

export type ClienteRow = {
  id_cliente: number;
  Cliente: string;
  Razao_social: string;
  Cidade: string;
  Vendedor: string;
  Limite: number;

  ultima_compra: string | null;   
  last_sale_orcamento_id: number;        // ISO string
  ultima_interacao: string | null;         // ISO string
  proxima_interacao: string | null;    // ISO string (anterior)
  observacoes: string | null;
  can_undo: boolean;                       // se pode desfazer hoje

  id_vendedor: number | null;
  ativo: boolean;
  telefone?: string | null;
  tel_celular?: string | null;
  orcamentos_abertos: number;
  validade_orcamento_min: string | null; // ISO
  tem_orcamento_aberto?: boolean; // ✅ adiciona isso
  open_budget_id?: number | null; // ✅ novo

};

export type ContatoRow = {
  id_contato: number;
  id_cliente: number;
  nome_contato: string;
  funcao: string | null;
  telefone: string | null;
  criado_em: string | null;
};

export type ClienteComContatos = ClienteRow & {
  contatos: ContatoRow[];
};
