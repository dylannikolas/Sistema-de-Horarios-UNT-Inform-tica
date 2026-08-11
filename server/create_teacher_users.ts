import pool from './db';
import { ResultSetHeader } from 'mysql2';

async function createUsersForTeachers() {
    try {
        console.log('\n🔐 CREANDO USUARIOS PARA DOCENTES');
        console.log('='.repeat(70));

        // Obtener todos los docentes
        const [teachers]: any = await pool.query('SELECT id, code, name, email FROM teachers');

        console.log(`\n📊 Total de docentes encontrados: ${teachers.length}\n`);

        let created = 0;
        let skipped = 0;

        for (const teacher of teachers) {
            try {
                // Verificar si ya existe un usuario para este docente
                const [existing]: any = await pool.query(
                    'SELECT id FROM users WHERE teacher_id = ?',
                    [teacher.id]
                );

                if (existing.length > 0) {
                    console.log(`⏭️  ${teacher.name} - Ya tiene usuario`);
                    skipped++;
                    continue;
                }

                // Crear usuario con:
                // - username: email del docente
                // - password: código del docente (temporal, debe cambiarla)
                // - role: DOCENTE
                // - teacher_id: ID del docente

                const username = teacher.email.split('@')[0]; // Parte antes del @
                const password = teacher.code; // Contraseña temporal = código

                await pool.query<ResultSetHeader>(
                    'INSERT INTO users (username, password, role, teacher_id, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [username, password, 'DOCENTE', teacher.id]
                );

                console.log(`✅ ${teacher.name}`);
                console.log(`   Usuario: ${username}`);
                console.log(`   Contraseña temporal: ${password}`);
                console.log(`   Email: ${teacher.email}\n`);

                created++;
            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  ${teacher.name} - Usuario ya existe (duplicado)\n`);
                    skipped++;
                } else {
                    console.error(`❌ Error creando usuario para ${teacher.name}:`, error.message);
                }
            }
        }

        console.log('='.repeat(70));
        console.log(`\n📈 RESUMEN:`);
        console.log(`   ✅ Usuarios creados: ${created}`);
        console.log(`   ⏭️  Usuarios existentes: ${skipped}`);
        console.log(`   📊 Total procesados: ${teachers.length}\n`);

        if (created > 0) {
            console.log('⚠️  IMPORTANTE:');
            console.log('   Las contraseñas temporales son los códigos de docente.');
            console.log('   Los docentes deben cambiar su contraseña al primer ingreso.\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

createUsersForTeachers();
