const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkAfterGrant() {
    try {
        // 1. Verificar existência de 'cidades' (no plural ou singular)
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%cidade%' OR table_name ILIKE '%municipio%' OR table_name ILIKE '%loc%' OR table_name ILIKE '%geo%')
    `);
        console.log("Tabelas de Cidades encontradas:", res.rows.map(r => r.table_name).join(', '));

        // 2. Verificar FK de 'bairros.cidade_id'
        const resFK = await radarPool.query(`
      SELECT
        kcu.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table
      FROM information_schema.key_column_usage AS kcu
      JOIN information_schema.referential_constraints AS rc
        ON kcu.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = rc.unique_constraint_name
      WHERE kcu.table_name = 'bairros'
    `);
        console.log("\nFKs de public.bairros:");
        console.log(resFK.rows.map(r => `${r.from_column} -> ${r.to_table}`).join('\n'));

        // 3. Listar colunas de 'bairros'
        const resB = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bairros'
    `);
        console.log("\nColunas de public.bairros:", resB.rows.map(r => r.column_name).join(', '));

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkAfterGrant();
