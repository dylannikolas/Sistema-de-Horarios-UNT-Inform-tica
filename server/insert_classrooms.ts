import pool from './db';

const classrooms = [
    // LABORATORIOS ESPECIALIZADOS - LAB A
    {
        code: 'LAB-A',
        name: 'LABORATORIO ESPECIALIZADO A',
        type: 'Laboratorio',
        capacity: 30,
        building: 'Edificio de Sistemas',
        floor: 2,
        equipment: 'Computadoras de alto rendimiento, Proyector, Pizarra digital',
        courses: [
            'Inteligencia Artificial II',
            'Estructura de Datos',
            'Computación Gráfica',
            'Redes de Computadoras II',
            'Comunicación de Datos',
            'Robótica',
            'Tópicos en Tecnologías Inmersivas',
            'Algoritmos y Complejidad',
            'Arquitectura y Org. de Computadoras',
            'Sistemas de Información',
            'Organización de Archivos',
            'Lenguajes Formales y Autómatas',
            'Ingeniería de Software II'
        ]
    },

    // LABORATORIOS ESPECIALIZADOS - LAB B
    {
        code: 'LAB-B',
        name: 'LABORATORIO ESPECIALIZADO B',
        type: 'Laboratorio',
        capacity: 30,
        building: 'Edificio de Sistemas',
        floor: 2,
        equipment: 'Computadoras de alto rendimiento, Proyector, Pizarra digital',
        courses: [
            'Trabajo de Investigación',
            'Electrónica para Computación',
            'Computación Gráfica Avanzada',
            'Tópicos en Tecnologías Inmersivas',
            'Arquitectura y Org. de Computadoras',
            'Comunicación de Datos',
            'Algoritmos y Complejidad'
        ]
    },

    // LABORATORIOS ESPECIALIZADOS - LAB C
    {
        code: 'LAB-C',
        name: 'LABORATORIO ESPECIALIZADO C',
        type: 'Laboratorio',
        capacity: 30,
        building: 'Edificio de Sistemas',
        floor: 2,
        equipment: 'Computadoras de alto rendimiento, Proyector, Pizarra digital',
        courses: [
            'Base de Datos II',
            'Lenguajes Formales y Autómatas',
            'Inteligencia Artificial II',
            'Ingeniería de Software II',
            'Comunicación de Datos',
            'Electrónica para Computación',
            'Organización de Archivos',
            'Sistemas Operativos II',
            'Arquitectura y Org. de Computadoras',
            'Estructura de Datos'
        ]
    },

    // AULAS TEÓRICAS ADICIONALES (para cursos que no requieren laboratorio)
    {
        code: 'AULA-T1',
        name: 'AULA TEÓRICA 101',
        type: 'Teoría',
        capacity: 40,
        building: 'Edificio de Sistemas',
        floor: 1,
        equipment: 'Proyector, Pizarra, Sistema de audio',
        courses: []
    },

    {
        code: 'AULA-T2',
        name: 'AULA TEÓRICA 102',
        type: 'Teoría',
        capacity: 40,
        building: 'Edificio de Sistemas',
        floor: 1,
        equipment: 'Proyector, Pizarra, Sistema de audio',
        courses: []
    },

    {
        code: 'AULA-T3',
        name: 'AULA TEÓRICA 201',
        type: 'Teoría',
        capacity: 45,
        building: 'Edificio de Sistemas',
        floor: 2,
        equipment: 'Proyector, Pizarra digital, Sistema de audio',
        courses: []
    },

    {
        code: 'AULA-T4',
        name: 'AULA TEÓRICA 202',
        type: 'Teoría',
        capacity: 45,
        building: 'Edificio de Sistemas',
        floor: 2,
        equipment: 'Proyector, Pizarra digital, Sistema de audio',
        courses: []
    },

    // LABORATORIO DE CÓMPUTO GENERAL
    {
        code: 'LAB-COMP-01',
        name: 'LABORATORIO DE CÓMPUTO 01',
        type: 'Laboratorio',
        capacity: 25,
        building: 'Edificio de Sistemas',
        floor: 1,
        equipment: 'Computadoras estándar, Proyector',
        courses: []
    },

    {
        code: 'LAB-COMP-02',
        name: 'LABORATORIO DE CÓMPUTO 02',
        type: 'Laboratorio',
        capacity: 25,
        building: 'Edificio de Sistemas',
        floor: 1,
        equipment: 'Computadoras estándar, Proyector',
        courses: []
    }
];

async function insertClassrooms() {
    try {
        console.log('🏫 INSERTANDO AULAS Y LABORATORIOS EN LA BASE DE DATOS\n');
        console.log('='.repeat(70));

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const classroom of classrooms) {
            try {
                await pool.query(
                    'INSERT INTO classrooms (name, type, capacity) VALUES (?, ?, ?)',
                    [classroom.name, classroom.type, classroom.capacity]
                );

                inserted++;
                console.log(`✅ ${classroom.code} - ${classroom.name}`);
                console.log(`   Tipo: ${classroom.type} | Capacidad: ${classroom.capacity} estudiantes`);
                console.log(`   Ubicación: ${classroom.building}, Piso ${classroom.floor}`);
                if (classroom.courses.length > 0) {
                    console.log(`   Cursos asignados: ${classroom.courses.length}`);
                }
            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY') {
                    skipped++;
                    console.log(`⚠️  Ya existe: ${classroom.code} - ${classroom.name}`);
                } else {
                    errors++;
                    console.error(`❌ Error insertando ${classroom.code}:`, error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMEN DE INSERCIÓN:');
        console.log(`   ✅ Insertados exitosamente: ${inserted}`);
        console.log(`   ⚠️  Omitidos (duplicados): ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📚 Total en lista: ${classrooms.length}`);

        // Verificar totales en la base de datos
        const [result]: any = await pool.query('SELECT COUNT(*) as total FROM classrooms');
        console.log(`   🗄️  Total en base de datos: ${result[0].total}`);

        // Mostrar aulas por tipo
        console.log('\n📋 AULAS POR TIPO:');
        const [byType]: any = await pool.query(`
      SELECT type, COUNT(*) as count, SUM(capacity) as total_capacity
      FROM classrooms 
      GROUP BY type 
      ORDER BY type
    `);

        byType.forEach((row: any) => {
            console.log(`   ${row.type.padEnd(15)}: ${row.count} aulas | Capacidad total: ${row.total_capacity} estudiantes`);
        });

        // Estadísticas de capacidad
        console.log('\n📈 ESTADÍSTICAS DE CAPACIDAD:');
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

        console.log('\n' + '='.repeat(70));
        console.log('✨ Proceso completado exitosamente!\n');

        await pool.end();
    } catch (error) {
        console.error('❌ Error general:', error);
        await pool.end();
        process.exit(1);
    }
}

insertClassrooms();
