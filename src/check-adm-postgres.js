const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'postgres', password: 'senha123', ssl: false
});

async function checkAdmSchema() {
    try {
        // Listar tabelas no schema ADM
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'adm'
      ORDER BY table_name
    `);

        if (res.rows.length === 0) {
            console.log("❌ Nenhuma tabela encontrada no schema 'adm'. (Ou sem permissão)");
        } else {
            console.log("✅ Tabelas no schema ADM:");
            console.log(res.rows.map(r => r.table_name).join(', '));

            // Se encontrar, listar colunas de Cidades e Bairros
            const tablesToCheck = ['cidades', 'bairros'];
            for (const t of tablesToCheck) {
                if (res.rows.some(r => r.table_name === t)) {
                    const resCols = await radarPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'adm' AND table_name = $1
            ORDER BY column_name
          `, [t]);
                    console.log(`\nColunas de adm.${t}:`);
                    console.log(resCols.rows.map(r => ` - ${r.column_name}`).join('\n'));
                }
            }
        }

    } catch (e) {
        console.error("Erro na conexão ou consulta:", e);
    } finally {
        await radarPool.end();
    }
}
checkAdmSchema();
