const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkRow() {
    try {
        const res = await radarPool.query(`
      SELECT * FROM public.funcionarios LIMIT 1;
    `);
        const keys = Object.keys(res.rows[0]);
        console.log("Has empresa_id?", keys.includes('empresa_id'));
        console.log("Has unidade_id?", keys.includes('unidade_id'));
        console.log("Has filial_id?", keys.includes('filial_id'));
        console.log("All keys starting with e or f or u:", keys.filter(k => k.startsWith('e') || k.startsWith('f') || k.startsWith('u')));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkRow();
