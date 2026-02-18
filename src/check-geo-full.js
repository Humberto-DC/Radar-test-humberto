const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkGeoPlural() {
    try {
        // 1. Colunas de 'bairros'
        const resBairros = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bairros'
      ORDER BY column_name
    `);
        console.log("\nColunas de public.bairros:");
        console.log(resBairros.rows.map(r => ` - ${r.column_name}`).join('\n'));

        // 2. Colunas de 'cidades' (se existir)
        const resCidadesCheck = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'cidades'
    `);

        if (resCidadesCheck.rows.length > 0) {
            const resCidades = await radarPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'cidades'
        ORDER BY column_name
      `);
            console.log("\nColunas de public.cidades:");
            console.log(resCidades.rows.map(r => ` - ${r.column_name}`).join('\n'));
        } else {
            console.log("\n❌ Tabela 'cidades' não encontrada. Procurando alternativas...");
            const resAlts = await radarPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name LIKE 'cid%' OR table_name LIKE 'mun%')
      `);
            console.log("Alternativas:", resAlts.rows.map(r => r.table_name).join(', '));
        }

        // 3. Colunas de 'estados' (já sabemos que existe 'estado' ou 'estados'?)
        const resEstadosCheck = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name = 'estado' OR table_name = 'estados' OR table_name = 'uf')
    `);
        console.log("\nTabela de Estados encontrada:", resEstadosCheck.rows.map(r => r.table_name).join(', '));
        if (resEstadosCheck.rows.length > 0) {
            const tName = resEstadosCheck.rows[0].table_name;
            const resEstados = await radarPool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '${tName}'
          ORDER BY column_name
        `);
            console.log(`Colunas de ${tName}:`);
            console.log(resEstados.rows.map(r => ` - ${r.column_name}`).join('\n'));
        }

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkGeoPlural();
