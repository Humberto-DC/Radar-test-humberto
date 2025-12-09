export interface Client {
  id_cliente: string | number; //
  Cliente: string; //
  Limite: number; //
  data_ultima_compra: string; //
  ultima_interacao: string; //
  Razao_social: string; //
  Vendedor: string; //
  id_vendedor:  string | number; //
  Cidade: string; //
  ativo: boolean;
}

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
