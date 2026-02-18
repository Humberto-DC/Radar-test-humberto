const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkBairroAgain() {
    try {
        const res = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros'
      AND (column_name LIKE '%bairro%' OR column_name LIKE '%cidade%')
      ORDER BY column_name
    `);
        console.log("Colunas de Bairro/Cidade em Cadastros:", res.rows.map(r => `${r.column_name}`).join(', '));

        // Check if there is a 'bairros' and 'cidades' table
        const res2 = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'bairros' OR table_name = 'cidades' OR table_name = 'estados') 
      ORDER BY table_name
    `);
        console.log("Tabelas Geograficas Encontradas:", res2.rows.map(r => r.table_name).join(', '));

        if (res2.rows.length > 0) {
            for (const t of res2.rows) {
                const res3 = await radarPool.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = '${t.table_name}' ORDER BY column_name
        `);
                console.log(`Colunas de ${t.table_name}:`, res3.rows.map(r => r.column_name).join(', '));
            }
        }
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkBairroAgain();
