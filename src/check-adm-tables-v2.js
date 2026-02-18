const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        console.log("=== BUSCANDO SCHEMAS E TABELAS ADM ===");

        // 1. Listar schemas de forma bruta
        const schemas = await pool.query("SELECT nspname FROM pg_namespace ORDER BY nspname");
        console.log("Schemas:", schemas.rows.map(r => r.nspname).join(', '));

        // 2. Tentar variações de acesso a CIDADES
        const variations = [
            'ADM.CIDADES',
            '"ADM"."CIDADES"',
            'adm.cidades',
            '"adm"."cidades"',
            'public.cidades',
            'cidades'
        ];

        for (const v of variations) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${v}`);
                console.log(`✅ Sucesso com [${v}]: ${res.rows[0].count} registros.`);
            } catch (e) {
                console.log(`❌ Falha com [${v}]: ${e.message}`);
            }
        }

        // 3. Mesma coisa para BAIRROS
        const variationsB = [
            'ADM.BAIRROS',
            '"ADM"."BAIRROS"',
            'public.bairros',
            'bairros'
        ];
        for (const v of variationsB) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${v}`);
                console.log(`✅ Sucesso com [${v}]: ${res.rows[0].count} registros.`);
            } catch (e) {
                console.log(`❌ Falha com [${v}]: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
