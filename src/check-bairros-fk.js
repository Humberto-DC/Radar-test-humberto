const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkFKs() {
    try {
        const res = await radarPool.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.key_column_usage AS kcu
      JOIN information_schema.referential_constraints AS rc
        ON kcu.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = rc.unique_constraint_name
      WHERE kcu.table_name = 'bairros'
      AND kcu.column_name = 'cidade_id'
    `);

        if (res.rows.length === 0) {
            console.log("❌ Nenhuma FK encontrada para a coluna 'cidade_id' na tabela 'bairros'.");

            // Vamos tentar um jeito mais bruto de encontrar onde está essa referência ou se ela não existe como FK
            const res2 = await radarPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
            console.log("Todas as tabelas do schema public:", res2.rows.map(r => r.table_name).join(', '));

        } else {
            console.log(`✅ A tabela 'bairros' (cidade_id) aponta para: ${res.rows[0].foreign_table_name}.${res.rows[0].foreign_column_name}`);
        }

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkFKs();
