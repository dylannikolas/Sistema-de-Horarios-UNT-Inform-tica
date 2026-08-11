import pool from './db';

async function testCourses() {
    try {
        console.log('🔍 VERIFICANDO CURSOS EN LA BASE DE DATOS\n');
        console.log('='.repeat(60));

        // 1. Total de cursos
        const [totalResult]: any = await pool.query('SELECT COUNT(*) as total FROM courses');
        console.log(`\n📊 Total de cursos: ${totalResult[0].total}`);

        // 2. Cursos por ciclo
        console.log('\n📋 Cursos por ciclo:');
        console.log('-'.repeat(60));
        const [byCycle]: any = await pool.query(`
      SELECT cycle, COUNT(*) as count 
      FROM courses 
      GROUP BY cycle 
      ORDER BY 
        CASE cycle
          WHEN 'I' THEN 1
          WHEN 'II' THEN 2
          WHEN 'III' THEN 3
          WHEN 'IV' THEN 4
          WHEN 'V' THEN 5
          WHEN 'VI' THEN 6
          WHEN 'VII' THEN 7
          WHEN 'VIII' THEN 8
          WHEN 'IX' THEN 9
          WHEN 'X' THEN 10
        END
    `);

        byCycle.forEach((row: any) => {
            console.log(`   Ciclo ${row.cycle.padEnd(4)}: ${row.count} cursos`);
        });

        // 3. Primeros 5 cursos de cada ciclo
        console.log('\n📚 Muestra de cursos por ciclo:');
        console.log('-'.repeat(60));

        const cycles = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        for (const cycle of cycles) {
            const [courses]: any = await pool.query(
                'SELECT code, name, credits FROM courses WHERE cycle = ? LIMIT 3',
                [cycle]
            );

            if (courses.length > 0) {
                console.log(`\n   🔹 CICLO ${cycle}:`);
                courses.forEach((course: any) => {
                    console.log(`      ${course.code} - ${course.name} (${course.credits} créditos)`);
                });
            }
        }

        // 4. Cursos con más créditos
        console.log('\n\n🏆 Top 5 cursos con más créditos:');
        console.log('-'.repeat(60));
        const [topCredits]: any = await pool.query(`
      SELECT code, name, cycle, credits, hours_per_week 
      FROM courses 
      ORDER BY credits DESC, hours_per_week DESC 
      LIMIT 5
    `);

        topCredits.forEach((course: any, index: number) => {
            console.log(`   ${index + 1}. ${course.code} - ${course.name}`);
            console.log(`      Ciclo: ${course.cycle} | Créditos: ${course.credits} | Horas/semana: ${course.hours_per_week}`);
        });

        // 5. Estadísticas generales
        console.log('\n\n📈 Estadísticas generales:');
        console.log('-'.repeat(60));
        const [stats]: any = await pool.query(`
      SELECT 
        MIN(credits) as min_credits,
        MAX(credits) as max_credits,
        AVG(credits) as avg_credits,
        SUM(credits) as total_credits,
        MIN(hours_per_week) as min_hours,
        MAX(hours_per_week) as max_hours,
        AVG(hours_per_week) as avg_hours
      FROM courses
    `);

        const s = stats[0];
        console.log(`   Créditos mínimos: ${s.min_credits}`);
        console.log(`   Créditos máximos: ${s.max_credits}`);
        console.log(`   Promedio de créditos: ${parseFloat(s.avg_credits).toFixed(2)}`);
        console.log(`   Total de créditos (toda la carrera): ${s.total_credits}`);
        console.log(`   Horas mínimas por semana: ${s.min_hours}`);
        console.log(`   Horas máximas por semana: ${s.max_hours}`);
        console.log(`   Promedio de horas por semana: ${parseFloat(s.avg_hours).toFixed(2)}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Verificación completada exitosamente!\n');

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
        process.exit(1);
    }
}

testCourses();
