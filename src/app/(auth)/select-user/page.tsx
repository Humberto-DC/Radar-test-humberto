import { radarPool } from "@/lib/Db";
import SelectUserClient from "@/components/auth/select-user/SelectUserClient";

type Seller = { id: number; nome: string };

export default async function Page() {
  const sql = `
    SELECT
      vendedor_id,
      TRIM(nome_vendedor) AS nome_vendedor
    FROM public.vw_web_clientes
    WHERE vendedor_id IS NOT NULL
      AND COALESCE(TRIM(nome_vendedor), '') <> ''
      AND TRIM(nome_vendedor) NOT IN (
        'ANA CLAUDIA DA COSTA SILVA',
        'LAIS PEREIRA BARBOSA',
        'IARA COSTA DA SILVA'
      )
    GROUP BY vendedor_id, TRIM(nome_vendedor)
    ORDER BY
      CASE
        WHEN UPPER(TRIM(nome_vendedor)) LIKE 'VENDEDOR%' THEN 1
        ELSE 0
      END,
      TRIM(nome_vendedor) ASC
  `;

  const { rows } = await radarPool.query<{
    vendedor_id: number;
    nome_vendedor: string;
  }>(sql);

  const sellers: Seller[] = [
    ...rows.map((r) => ({
      id: Math.trunc(Number(r.vendedor_id)),
      nome: r.nome_vendedor.trim(),
    })),
    {
      id: -1,
      nome: "SEM VENDEDOR",
    },
  ];
  return <SelectUserClient sellers={sellers} />;
}
