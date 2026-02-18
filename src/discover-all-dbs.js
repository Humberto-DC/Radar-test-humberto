const { Pool } = require('pg');

const config = {
    host: '172.16.0.32', port: 5432,
    user: 'postgres', password: 'senha123', ssl: false
};

async function checkDb(dbName) {
    const pool = new Pool({ ...config, database: dbName });
    try {
        const res = await pool.query("SELECT nspname FROM pg_namespace");
        console.log(`--- Schemas em [${dbName}] ---`);
        console.log(res.rows.map(r => r.nspname).join(', '));

        const resTables = await pool.query(`
      SELECT n.nspname, c.relname 
      FROM pg_class c 
      JOIN pg_namespace n ON n.oid = c.relnamespace 
      WHERE c.relname ILIKE '%cidade%' OR c.relname ILIKE '%bairro%'
    `);
        if (resTables.rows.length > 0) {
            console.log(`Tabelas interessantes em [${dbName}]:`);
            resTables.rows.forEach(r => console.log(` - ${r.nspname}.${r.relname}`));
        }
    } catch (e) {
        console.log(`Erro ao acessar [${dbName}]:`, e.message);
    } finally {
        await pool.end();
    }
}

async function run() {
    await checkDb('migracao_oracle');
    await checkDb('postgres');
}
run();
