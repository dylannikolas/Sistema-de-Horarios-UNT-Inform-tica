import pool from './db';

async function checkTeacherIds() {
    try {
        const [rows]: any = await pool.query('SELECT id, code, name FROM teachers ORDER BY id');

        console.log('\n📋 DOCENTES Y SUS IDs:');
        console.log('='.repeat(70));

        rows.forEach((teacher: any) => {
            console.log(`   ID: ${teacher.id} | Código: ${teacher.code} | ${teacher.name}`);
        });

        console.log('='.repeat(70));
        console.log(`\n✅ Total de docentes: ${rows.length}`);
        console.log(`📊 Rango de IDs: ${rows[0]?.id} - ${rows[rows.length - 1]?.id}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

checkTeacherIds();
