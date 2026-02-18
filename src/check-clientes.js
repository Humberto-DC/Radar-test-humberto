const { Pool } = require('pg');
const fs = require('fs');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkClientes() {
    try {
        const res = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY column_name
    `);
        fs.writeFileSync('clientes_cols.txt', res.rows.map(r => r.column_name).join('\n'));
        console.log("Salvo em clientes_cols.txt");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkClientes();
