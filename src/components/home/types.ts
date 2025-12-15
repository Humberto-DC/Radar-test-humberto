export type Client = {
  id_cliente: number;
  Cliente: string;
  Razao_social: string;
  Cidade: string;
  Vendedor: string;
  Limite: number;

  data_ultima_compra: string | null;     // date no Postgres vem como string
  ultima_interacao: string | null;       // timestamptz vem como string

  id_vendedor: number | null;
  ativo: boolean;
};


export interface Message {
  id_mensagem: string;
  titulo: string;
  texto: string;
  imagem?: string;
  categoria: string;
  status: string;
}

export interface Contacts {
  id_contato: string;
  id_cliente: string;
  nome_contato: string;
  funcao: string | null;
  telefone: string | null;
}

export type SelectedMap = Record<string, boolean>;
