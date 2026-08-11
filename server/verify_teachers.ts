import pool from './db';

async function verifyTeachers() {
    try {
        console.log('🔍 VERIFICANDO DOCENTES EN LA BASE DE DATOS\n');
        console.log('='.repeat(70));

        // 1. Total de docentes
        const [totalResult]: any = await pool.query('SELECT COUNT(*) as total FROM teachers');
        console.log(`\n📊 Total de docentes: ${totalResult[0].total}`);

        // 2. Docentes por categoría
        console.log('\n📋 DOCENTES POR CATEGORÍA:');
        console.log('-'.repeat(70));
        const [byCategory]: any = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM teachers 
      GROUP BY category 
      ORDER BY 
        CASE category
          WHEN 'Principal' THEN 1
          WHEN 'Asociado' THEN 2
          WHEN 'Auxiliar' THEN 3
          WHEN 'Contratado' THEN 4
        END
    `);

        byCategory.forEach((row: any) => {
            console.log(`   ${row.category.padEnd(12)}: ${row.count} docentes`);
        });

        // 3. Docentes por horas máximas
        console.log('\n⏰ DISTRIBUCIÓN POR HORAS MÁXIMAS:');
        console.log('-'.repeat(70));
        const [byHours]: any = await pool.query(`
      SELECT max_hours, COUNT(*) as count 
      FROM teachers 
      GROUP BY max_hours 
      ORDER BY max_hours DESC
    `);

        byHours.forEach((row: any) => {
            console.log(`   ${row.max_hours} horas/semana: ${row.count} docentes`);
        });

        // 4. Listado de docentes principales
        console.log('\n\n👑 DOCENTES PRINCIPALES:');
        console.log('-'.repeat(70));
        const [principals]: any = await pool.query(`
      SELECT code, name, email, max_hours 
      FROM teachers 
      WHERE category = 'Principal'
      ORDER BY code
    `);

        principals.forEach((teacher: any) => {
            console.log(`   ${teacher.code} - ${teacher.name}`);
            console.log(`      Email: ${teacher.email} | Max horas: ${teacher.max_hours}`);
        });

        // 5. Listado de docentes asociados
        console.log('\n\n🎓 DOCENTES ASOCIADOS:');
        console.log('-'.repeat(70));
        const [associates]: any = await pool.query(`
      SELECT code, name, email, max_hours 
      FROM teachers 
      WHERE category = 'Asociado'
      ORDER BY code
    `);

        associates.forEach((teacher: any) => {
            console.log(`   ${teacher.code} - ${teacher.name}`);
            console.log(`      Email: ${teacher.email} | Max horas: ${teacher.max_hours}`);
        });

        // 6. Listado de docentes auxiliares
        console.log('\n\n📚 DOCENTES AUXILIARES:');
        console.log('-'.repeat(70));
        const [auxiliaries]: any = await pool.query(`
      SELECT code, name, email, max_hours 
      FROM teachers 
      WHERE category = 'Auxiliar'
      ORDER BY code
    `);

        auxiliaries.forEach((teacher: any) => {
            console.log(`   ${teacher.code} - ${teacher.name}`);
            console.log(`      Email: ${teacher.email} | Max horas: ${teacher.max_hours}`);
        });

        // 7. Listado de docentes contratados
        console.log('\n\n💼 DOCENTES CONTRATADOS:');
        console.log('-'.repeat(70));
        const [contractors]: any = await pool.query(`
      SELECT code, name, email, max_hours 
      FROM teachers 
      WHERE category = 'Contratado'
      ORDER BY code
    `);

        contractors.forEach((teacher: any) => {
            console.log(`   ${teacher.code} - ${teacher.name}`);
            console.log(`      Email: ${teacher.email} | Max horas: ${teacher.max_hours}`);
        });

        // 8. Estadísticas generales
        console.log('\n\n📈 ESTADÍSTICAS GENERALES:');
        console.log('-'.repeat(70));
        const [stats]: any = await pool.query(`
      SELECT 
        MIN(max_hours) as min_hours,
        MAX(max_hours) as max_hours,
        AVG(max_hours) as avg_hours,
        SUM(max_hours) as total_hours
      FROM teachers
    `);

        const s = stats[0];
        console.log(`   Horas mínimas por docente: ${s.min_hours}`);
        console.log(`   Horas máximas por docente: ${s.max_hours}`);
        console.log(`   Promedio de horas: ${parseFloat(s.avg_hours).toFixed(2)}`);
        console.log(`   Total de horas disponibles: ${s.total_hours}`);

        // 9. Verificar emails únicos
        const [emailCheck]: any = await pool.query(`
      SELECT email, COUNT(*) as count 
      FROM teachers 
      GROUP BY email 
      HAVING count > 1
    `);

        if (emailCheck.length > 0) {
            console.log('\n⚠️  ADVERTENCIA: Emails duplicados encontrados:');
            emailCheck.forEach((row: any) => {
                console.log(`   ${row.email}: ${row.count} veces`);
            });
        } else {
            console.log('\n✅ Todos los emails son únicos');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ Verificación completada exitosamente!\n');

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
        process.exit(1);
    }
}

verifyTeachers();
