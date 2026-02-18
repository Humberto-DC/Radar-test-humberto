const { Pool } = require('pg');
const fs = require('fs');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function listCols() {
    try {
        const viewCols = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes' ORDER BY column_name
    `);

        const tableCols = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cadastros' ORDER BY column_name
    `);

        const output = `
VW_WEB_CLIENTES:
${viewCols.rows.map(r => r.column_name).join('\n')}

CADASTROS:
${tableCols.rows.map(r => r.column_name).join('\n')}
    `;

        fs.writeFileSync('cols_list.txt', output);
        console.log("Salvo em cols_list.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}
listCols();
