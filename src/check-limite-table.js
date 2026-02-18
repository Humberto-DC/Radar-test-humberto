const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        console.log("Buscando pela tabela: clientes_limite_credito");

        const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE 'clientes_limite_credito'
    `);

        console.log("Resultado da busca:", res.rows);

        if (res.rows.length > 0) {
            const { table_schema, table_name } = res.rows[0];
            const resCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY column_name
      `, [table_schema, table_name]);

            console.log(`Colunas de ${table_schema}.${table_name}:`);
            console.log(resCols.rows.map(r => ` - ${r.column_name} (${r.data_type})`).join('\n'));

            const resData = await pool.query(`SELECT * FROM "${table_schema}"."${table_name}" LIMIT 1`);
            console.log("Exemplo de dados:", resData.rows[0]);
        } else {
            console.log("Tabela não encontrada via ILIKE.");
            // Tentar busca direta no pg_class
            const resClass = await pool.query(`
        SELECT n.nspname as schema, c.relname as name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname ILIKE '%limite_credito%'
      `);
            console.log("Busca via pg_class:", resClass.rows);
        }

    } catch (e) {
        console.error("Erro:", e.message);
    } finally {
        pool.end();
    }
}
run();
