import pool from './db';

async function verifyClassrooms() {
    try {
        console.log('🔍 VERIFICANDO AULAS Y LABORATORIOS EN LA BASE DE DATOS\n');
        console.log('='.repeat(70));

        // 1. Total de aulas
        const [totalResult]: any = await pool.query('SELECT COUNT(*) as total FROM classrooms');
        console.log(`\n📊 Total de aulas: ${totalResult[0].total}`);

        // 2. Aulas por tipo
        console.log('\n📋 AULAS POR TIPO:');
        console.log('-'.repeat(70));
        const [byType]: any = await pool.query(`
      SELECT 
        type, 
        COUNT(*) as count,
        SUM(capacity) as total_capacity,
        AVG(capacity) as avg_capacity
      FROM classrooms 
      GROUP BY type 
      ORDER BY type
    `);

        byType.forEach((row: any) => {
            console.log(`   ${row.type.padEnd(15)}: ${row.count} aulas`);
            console.log(`      Capacidad total: ${row.total_capacity} estudiantes`);
            console.log(`      Capacidad promedio: ${parseFloat(row.avg_capacity).toFixed(2)} estudiantes`);
        });

        // 3. Listado de laboratorios
        console.log('\n\n🔬 LABORATORIOS:');
        console.log('-'.repeat(70));
        const [labs]: any = await pool.query(`
      SELECT id, name, capacity 
      FROM classrooms 
      WHERE type = 'Laboratorio'
      ORDER BY name
    `);

        labs.forEach((lab: any, index: number) => {
            console.log(`   ${index + 1}. ${lab.name}`);
            console.log(`      Capacidad: ${lab.capacity} estudiantes | ID: ${lab.id}`);
        });

        // 4. Listado de aulas teóricas
        console.log('\n\n📚 AULAS TEÓRICAS:');
        console.log('-'.repeat(70));
        const [theory]: any = await pool.query(`
      SELECT id, name, capacity 
      FROM classrooms 
      WHERE type = 'Teoría'
      ORDER BY name
    `);

        theory.forEach((aula: any, index: number) => {
            console.log(`   ${index + 1}. ${aula.name}`);
            console.log(`      Capacidad: ${aula.capacity} estudiantes | ID: ${aula.id}`);
        });

        // 5. Estadísticas de capacidad
        console.log('\n\n📈 ESTADÍSTICAS DE CAPACIDAD:');
        console.log('-'.repeat(70));
        const [stats]: any = await pool.query(`
      SELECT 
        MIN(capacity) as min_capacity,
        MAX(capacity) as max_capacity,
        AVG(capacity) as avg_capacity,
        SUM(capacity) as total_capacity
      FROM classrooms
    `);

        const s = stats[0];
        console.log(`   Capacidad mínima: ${s.min_capacity} estudiantes`);
        console.log(`   Capacidad máxima: ${s.max_capacity} estudiantes`);
        console.log(`   Capacidad promedio: ${parseFloat(s.avg_capacity).toFixed(2)} estudiantes`);
        console.log(`   Capacidad total: ${s.total_capacity} estudiantes`);

        // 6. Distribución de capacidad
        console.log('\n\n📊 DISTRIBUCIÓN DE CAPACIDAD:');
        console.log('-'.repeat(70));
        const [distribution]: any = await pool.query(`
      SELECT 
        CASE 
          WHEN capacity < 30 THEN 'Pequeña (< 30)'
          WHEN capacity >= 30 AND capacity < 40 THEN 'Mediana (30-39)'
          ELSE 'Grande (>= 40)'
        END as size_category,
        COUNT(*) as count,
        SUM(capacity) as total_capacity
      FROM classrooms
      GROUP BY size_category
      ORDER BY 
        CASE size_category
          WHEN 'Pequeña (< 30)' THEN 1
          WHEN 'Mediana (30-39)' THEN 2
          ELSE 3
        END
    `);

        distribution.forEach((row: any) => {
            console.log(`   ${row.size_category.padEnd(20)}: ${row.count} aulas (${row.total_capacity} estudiantes)`);
        });

        // 7. Verificar asignaciones (si existen)
        const [assignments]: any = await pool.query(`
      SELECT COUNT(*) as count FROM assignments
    `);

        if (assignments[0].count > 0) {
            console.log('\n\n📅 ASIGNACIONES DE AULAS:');
            console.log('-'.repeat(70));
            const [aulaUsage]: any = await pool.query(`
        SELECT 
          c.name,
          c.type,
          COUNT(a.id) as assignments_count
        FROM classrooms c
        LEFT JOIN assignments a ON c.id = a.classroom_id
        GROUP BY c.id
        ORDER BY assignments_count DESC, c.name
      `);

            aulaUsage.forEach((row: any) => {
                const usage = row.assignments_count > 0 ? `${row.assignments_count} asignaciones` : 'Sin asignaciones';
                console.log(`   ${row.name.padEnd(35)}: ${usage}`);
            });
        } else {
            console.log('\n\n📅 No hay asignaciones de aulas aún');
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

verifyClassrooms();
