import pool from './db';

const courses = [
    // CICLO I (7 cursos)
    { code: '13024', name: 'Desarrollo personal', cycle: 'I', credits: 3, hours_per_week: 4 },
    { code: '13029', name: 'Lectura crítica y redacción de textos acad.', cycle: 'I', credits: 3, hours_per_week: 4 },
    { code: '13027', name: 'Física general', cycle: 'I', credits: 4, hours_per_week: 6 },
    { code: '13021', name: 'Algoritmos y programación', cycle: 'I', credits: 4, hours_per_week: 6 },
    { code: '13023', name: 'Desarrollo del pensamiento lógico matemático', cycle: 'I', credits: 3, hours_per_week: 5 },
    { code: '13028', name: 'Introducción al análisis matemático', cycle: 'I', credits: 4, hours_per_week: 6 },
    { code: '13031', name: 'Taller de liderazgo y trabajo en equipo', cycle: 'I', credits: 1, hours_per_week: 2 },

    // CICLO II (7 cursos)
    { code: '13040', name: 'Ética, convivencia humana y ciudadanía', cycle: 'II', credits: 3, hours_per_week: 4 },
    { code: '13043', name: 'Sociedad, cultura y ecología', cycle: 'II', credits: 3, hours_per_week: 5 },
    { code: '13036', name: 'Cultura investigativa y pensamiento crítico', cycle: 'II', credits: 3, hours_per_week: 4 },
    { code: '13039', name: 'Estructura de datos', cycle: 'II', credits: 4, hours_per_week: 6 },
    { code: '13038', name: 'Estadística general', cycle: 'II', credits: 4, hours_per_week: 6 },
    { code: '13034', name: 'Análisis matemático', cycle: 'II', credits: 4, hours_per_week: 6 },
    { code: '13046', name: 'Taller de manejo de TIC', cycle: 'II', credits: 1, hours_per_week: 2 },

    // CICLO III (6 cursos)
    { code: '13629', name: 'Geometría analítica', cycle: 'III', credits: 4, hours_per_week: 6 },
    { code: '13630', name: 'Paradigmas de lenguajes de programación', cycle: 'III', credits: 4, hours_per_week: 6 },
    { code: '13631', name: 'Estrategias algorítmicas', cycle: 'III', credits: 4, hours_per_week: 6 },
    { code: '13632', name: 'Matemática discreta', cycle: 'III', credits: 4, hours_per_week: 6 },
    { code: '13633', name: 'Física para ciencia de la computación', cycle: 'III', credits: 3, hours_per_week: 4 },
    { code: '13634', name: 'Análisis numérico', cycle: 'III', credits: 3, hours_per_week: 4 },

    // CICLO IV (6 cursos)
    { code: '13635', name: 'Computación gráfica', cycle: 'IV', credits: 4, hours_per_week: 6 },
    { code: '13636', name: 'Organización de archivos', cycle: 'IV', credits: 3, hours_per_week: 4 },
    { code: '13637', name: 'Algoritmos y complejidad', cycle: 'IV', credits: 4, hours_per_week: 6 },
    { code: '13638', name: 'Lenguajes formales y autómatas', cycle: 'IV', credits: 4, hours_per_week: 6 },
    { code: '13639', name: 'Electrónica para computación', cycle: 'IV', credits: 4, hours_per_week: 6 },
    { code: '13640', name: 'Innovación y emprendimiento', cycle: 'IV', credits: 3, hours_per_week: 4 },

    // CICLO V (6 cursos)
    { code: '13641', name: 'Base de datos I', cycle: 'V', credits: 4, hours_per_week: 6 },
    { code: '13642', name: 'Ingeniería de software I', cycle: 'V', credits: 4, hours_per_week: 6 },
    { code: '13643', name: 'Inteligencia artificial I', cycle: 'V', credits: 4, hours_per_week: 6 },
    { code: '13644', name: 'Compiladores', cycle: 'V', credits: 4, hours_per_week: 6 },
    { code: '13645', name: 'Técnicas digitales para computación', cycle: 'V', credits: 4, hours_per_week: 6 },
    { code: '13646', name: 'Metodología de la investigación científica', cycle: 'V', credits: 2, hours_per_week: 2 },

    // CICLO VI (6 cursos)
    { code: '14068', name: 'Computación gráfica avanzada', cycle: 'VI', credits: 4, hours_per_week: 6 },
    { code: '14069', name: 'Base de datos II', cycle: 'VI', credits: 4, hours_per_week: 6 },
    { code: '14070', name: 'Ingeniería de software II', cycle: 'VI', credits: 4, hours_per_week: 6 },
    { code: '14071', name: 'Inteligencia artificial II', cycle: 'VI', credits: 2, hours_per_week: 4 },
    { code: '14072', name: 'Comunicación de datos', cycle: 'VI', credits: 4, hours_per_week: 6 },
    { code: '14073', name: 'Arquitectura y org. de computadoras', cycle: 'VI', credits: 4, hours_per_week: 6 },

    // CICLO VII (6 cursos)
    { code: '14074', name: 'Base de datos avanzada', cycle: 'VII', credits: 4, hours_per_week: 6 },
    { code: '14075', name: 'Desarrollo de software', cycle: 'VII', credits: 4, hours_per_week: 6 },
    { code: '14076', name: 'Percepción y visión por computadora', cycle: 'VII', credits: 4, hours_per_week: 6 },
    { code: '14077', name: 'Redes de computadoras I', cycle: 'VII', credits: 4, hours_per_week: 6 },
    { code: '14078', name: 'Sistemas operativos I', cycle: 'VII', credits: 4, hours_per_week: 6 },
    { code: '14079', name: 'Gestión de proyectos informáticos', cycle: 'VII', credits: 2, hours_per_week: 4 },

    // CICLO VIII (4 cursos)
    { code: '14080', name: 'Robótica', cycle: 'VIII', credits: 4, hours_per_week: 6 },
    { code: '14081', name: 'Redes de computadoras II', cycle: 'VIII', credits: 4, hours_per_week: 6 },
    { code: '14082', name: 'Sistemas operativos II', cycle: 'VIII', credits: 4, hours_per_week: 6 },
    { code: '14083', name: 'Prácticas pre-profesionales', cycle: 'VIII', credits: 10, hours_per_week: 19 },

    // CICLO IX (6 cursos)
    { code: '14084', name: 'Interacción humano-computador', cycle: 'IX', credits: 4, hours_per_week: 6 },
    { code: '14085', name: 'Tópicos en base de datos', cycle: 'IX', credits: 4, hours_per_week: 6 },
    { code: 'INF34', name: 'Tópicos en ingeniería de software', cycle: 'IX', credits: 4, hours_per_week: 6 },
    { code: '14087', name: 'Ingeniería de software avanzada', cycle: 'IX', credits: 4, hours_per_week: 6 },
    { code: '14088', name: 'Seguridad informática', cycle: 'IX', credits: 4, hours_per_week: 6 },
    { code: '14089', name: 'Proyecto de tesis', cycle: 'IX', credits: 2, hours_per_week: 3 },

    // CICLO X (6 cursos)
    { code: '14090', name: 'Tópicos en tecnologías inmersivas', cycle: 'X', credits: 4, hours_per_week: 6 },
    { code: '14091', name: 'Sistemas de información', cycle: 'X', credits: 3, hours_per_week: 4 },
    { code: '14092', name: 'Ética para profesionales en informática', cycle: 'X', credits: 3, hours_per_week: 4 },
    { code: '14093', name: 'Proyecto de competencia', cycle: 'X', credits: 2, hours_per_week: 4 },
    { code: '14094', name: 'Proyecto integrador', cycle: 'X', credits: 4, hours_per_week: 6 },
    { code: 'INF43', name: 'Tesis', cycle: 'X', credits: 1, hours_per_week: 2 }
];

async function insertCourses() {
    try {
        console.log('🚀 Iniciando inserción de cursos (Malla 2017 - 60 cursos)...');

        let inserted = 0;
        let skipped = 0;

        for (const course of courses) {
            try {
                await pool.query(
                    'INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES (?, ?, ?, ?, ?)',
                    [course.code, course.name, course.cycle, course.credits, course.hours_per_week]
                );
                inserted++;
                console.log(`✅ Insertado: ${course.code} - ${course.name}`);
            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY') {
                    skipped++;
                    console.log(`⚠️  Ya existe: ${course.code} - ${course.name}`);
                } else {
                    console.error(`❌ Error insertando ${course.code}:`, error.message);
                }
            }
        }

        console.log('\n📊 Resumen:');
        console.log(`   ✅ Insertados: ${inserted}`);
        console.log(`   ⚠️  Omitidos (ya existían): ${skipped}`);
        console.log(`   📚 Total en lista: ${courses.length}`);

        const [result]: any = await pool.query('SELECT COUNT(*) as total FROM courses');
        console.log(`   🗄️  Total en base de datos: ${result[0].total}`);

        await pool.end();
        console.log('\n✨ Proceso completado exitosamente!');
    } catch (error) {
        console.error('❌ Error general:', error);
        await pool.end();
        process.exit(1);
    }
}

insertCourses();
