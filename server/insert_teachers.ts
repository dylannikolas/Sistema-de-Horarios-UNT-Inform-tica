import pool from './db';

const teachers = [
    {
        code: 'DOC-01',
        name: 'GUTIERREZ GUTIERREZ JORGE LUIS',
        email: 'jgutierrez@unitru.edu.pe',
        category: 'Principal',
        degree: 'Doctor',
        phone: '958501455'
    },
    {
        code: 'DOC-02',
        name: 'RODRIGUEZ MELQUIADES JOSE ANTONIO',
        email: 'jrodriguez@unitru.edu.pe',
        category: 'Principal',
        degree: 'Doctor',
        phone: '943672599'
    },
    {
        code: 'DOC-03',
        name: 'CASTILLO DIESTRA CARLOS ENRIQUE',
        email: 'ccastillod@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '949943542'
    },
    {
        code: 'DOC-04',
        name: 'SIFUENTES DIAZ YENNY MILAGROS',
        email: 'ysifuentes@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '920087034'
    },
    {
        code: 'DOC-05',
        name: 'CRUZ SILVA JOSE GABRIEL',
        email: 'jcruz@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '948131835'
    },
    {
        code: 'DOC-06',
        name: 'MENDOZA TORRES EDWIN RAUL',
        email: 'emendoza@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '956335265'
    },
    {
        code: 'DOC-07',
        name: 'SALAZAR CAMPOS JUAN ORLANDO',
        email: 'jsalazarc@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '997891064'
    },
    {
        code: 'DOC-08',
        name: 'CRUZ FLORIAN IRIS AUREA',
        email: 'icruz@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Bachiller',
        phone: '999221908'
    },
    {
        code: 'DOC-09',
        name: 'PERALTA LUJAN JOSE LUIS',
        email: 'jperalta@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Maestro',
        phone: '963915448'
    },
    {
        code: 'DOC-10',
        name: 'GOMEZ MORALES ANTHONY JOSE',
        email: 'agomez@unitru.edu.pe',
        category: 'Asociado',
        degree: 'Maestro',
        phone: '949362161'
    },
    {
        code: 'DOC-11',
        name: 'GUEVARA RUIZ RICARDO MANUEL',
        email: 'rguevara@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Maestro',
        phone: '949001660'
    },
    {
        code: 'DOC-12',
        name: 'PEDRO HUAMAN LIZ SOFIA RAYMUNDA',
        email: 'lpedro@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Maestro',
        phone: '975750611'
    },
    {
        code: 'DOC-13',
        name: 'POLO ROMERO VICTOR JAIME',
        email: 'vpolo@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Maestro',
        phone: '948865210'
    },
    {
        code: 'DOC-14',
        name: 'QUISPE VARON CELESTINO MEDARDO',
        email: 'cmquispe@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Maestro',
        phone: '986233369'
    },
    {
        code: 'DOC-15',
        name: 'PEREYRA SALVADOR PATRICIA GISSELLA',
        email: 'ppereyra@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Doctor',
        phone: '965788654'
    },
    {
        code: 'DOC-16',
        name: 'PACHECO TORRES JUAN FRANCISCO',
        email: 'fpacheco@unitru.edu.pe',
        category: 'Auxiliar',
        degree: 'Doctor',
        phone: '995311558'
    },
    {
        code: 'DOC-17',
        name: 'BRAVO ESCALANTE JORGE DAVID',
        email: 'jbravo@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '942173864'
    },
    {
        code: 'DOC-18',
        name: 'RAMIREZ CERNA LOURDES',
        email: 'lramirezc@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '998617896'
    },
    {
        code: 'DOC-19',
        name: 'ALVARADO RAMOS JORGE LUIS',
        email: 'jalvarador@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '951205145'
    },
    {
        code: 'DOC-20',
        name: 'UROUZO GOMEZ YOSIP VLADIMIR',
        email: 'yurquizo@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '999581289'
    },
    {
        code: 'DOC-21',
        name: 'ABANTO CONCUEAR MANUEL REGILDER',
        email: 'mabantoco@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '946573970'
    },
    {
        code: 'DOC-22',
        name: 'SALCEDO QUIÑONES MARTIN GUSTAVO',
        email: 'msalcedo@unitru.edu.pe',
        category: 'Contratado',
        degree: 'Maestro',
        phone: '999999999' // No visible en la imagen
    }
];

async function insertTeachers() {
    try {
        console.log('👨‍🏫 INSERTANDO DOCENTES EN LA BASE DE DATOS\n');
        console.log('='.repeat(70));

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const teacher of teachers) {
            try {
                // Generar avatar aleatorio basado en el nombre
                const avatarSeed = teacher.name.split(' ')[0].toLowerCase();
                const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

                // Determinar max_hours según categoría
                let maxHours = 20;
                if (teacher.category === 'Principal') maxHours = 20;
                else if (teacher.category === 'Asociado') maxHours = 18;
                else if (teacher.category === 'Auxiliar') maxHours = 16;
                else if (teacher.category === 'Contratado') maxHours = 12;

                await pool.query(
                    'INSERT INTO teachers (name, email, category, code, avatar, max_hours, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [teacher.name, teacher.email, teacher.category, teacher.code, avatar, maxHours, 'DOCENTE']
                );

                inserted++;
                console.log(`✅ ${teacher.code} - ${teacher.name}`);
                console.log(`   Email: ${teacher.email} | Categoría: ${teacher.category} | Grado: ${teacher.degree}`);
            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY') {
                    skipped++;
                    console.log(`⚠️  Ya existe: ${teacher.code} - ${teacher.name}`);
                } else {
                    errors++;
                    console.error(`❌ Error insertando ${teacher.code}:`, error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMEN DE INSERCIÓN:');
        console.log(`   ✅ Insertados exitosamente: ${inserted}`);
        console.log(`   ⚠️  Omitidos (duplicados): ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📚 Total en lista: ${teachers.length}`);

        // Verificar totales en la base de datos
        const [result]: any = await pool.query('SELECT COUNT(*) as total FROM teachers');
        console.log(`   🗄️  Total en base de datos: ${result[0].total}`);

        // Mostrar docentes por categoría
        console.log('\n📋 DOCENTES POR CATEGORÍA:');
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

        // Mostrar docentes por grado académico (basado en los datos insertados)
        console.log('\n🎓 DISTRIBUCIÓN POR GRADO ACADÉMICO:');
        const doctores = teachers.filter(t => t.degree === 'Doctor').length;
        const maestros = teachers.filter(t => t.degree === 'Maestro').length;
        const bachilleres = teachers.filter(t => t.degree === 'Bachiller').length;

        console.log(`   Doctor     : ${doctores} docentes`);
        console.log(`   Maestro    : ${maestros} docentes`);
        console.log(`   Bachiller  : ${bachilleres} docentes`);

        console.log('\n' + '='.repeat(70));
        console.log('✨ Proceso completado exitosamente!\n');

        await pool.end();
    } catch (error) {
        console.error('❌ Error general:', error);
        await pool.end();
        process.exit(1);
    }
}

insertTeachers();
