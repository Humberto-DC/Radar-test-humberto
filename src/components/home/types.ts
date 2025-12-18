export type Client = {
  id_cliente: number;
  Cliente: string;
  Razao_social: string;
  Cidade: string;
  Vendedor: string;
  Limite: number;

  // agora pode vir "2025-12-01" OU "37"
  ultima_compra: string | Date | null | undefined

  // pode manter assim, mas também dá pra aceitar number se um dia mudar
  ultima_interacao: string | Date | null | undefined

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
