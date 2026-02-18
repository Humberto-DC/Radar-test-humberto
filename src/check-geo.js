const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkBairro() {
    try {
        const res = await radarPool.query(`
      SELECT * FROM information_schema.columns 
      WHERE table_name = 'cadastros'
      AND column_name LIKE '%bairro%'
    `);
        console.log("Colunas de bairro em cadastros:", res.rows.map(r => r.column_name).join(', '));

        // Check if there is a 'bairros' or 'cidades' table
        const res2 = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        // Look for anything resembling geography
        const geoTables = res2.rows.filter(r =>
            ['cidade', 'estado', 'bairro', 'municipio', 'uf', 'pais'].some(k => r.table_name.includes(k))
        );
        console.log("Tabelas geograficas:", geoTables.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkBairro();
