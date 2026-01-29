type Row = {
  cadastro_id: string | number;
  nome_razao_social: string | null;
  nome_fantasia: string | null;
  nome_cidade: string | null;
  estado_id: string | null;
  nome_vendedor: string | null;
  vendedor_id: string | number | null;
  limite_credito_aprovado: number | null; // ✅ NOVO
  cliente_ativo: string | null;

  orcamentos_abertos: number;
  validade_orcamento_min: Date | null;
  tem_orcamento_aberto: boolean | "t" | "f" | 1 | 0;
  open_budget_id: number | null;

  contatos_json: Array<{
    id_contato: number;
    id_cliente: number;
    nome_contato: string | null;
    funcao: string | null;
    telefone: string | null;
    celular: string | null;
    criado_em: string | Date | null;
  }>;
};
