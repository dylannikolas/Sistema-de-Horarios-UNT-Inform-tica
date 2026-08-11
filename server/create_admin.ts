import pool from './db';
import { ResultSetHeader } from 'mysql2';

async function createAdmin() {
    try {
        console.log('\n👑 CREANDO USUARIO ADMINISTRADOR');
        console.log('='.repeat(70));

        // Verificar si ya existe un admin
        const [existing]: any = await pool.query(
            'SELECT id FROM users WHERE username = ?',
            ['admin']
        );

        if (existing.length > 0) {
            console.log('\n⚠️  El usuario administrador ya existe.');
            console.log('\n📋 Credenciales:');
            console.log('   Usuario: admin');
            console.log('   Contraseña: admin123\n');
            return;
        }

        // Crear usuario administrador
        await pool.query<ResultSetHeader>(
            'INSERT INTO users (username, password, role, teacher_id, created_at) VALUES (?, ?, ?, ?, NOW())',
            ['admin', 'admin123', 'ADMIN', null]
        );

        console.log('\n✅ Usuario administrador creado exitosamente!\n');
        console.log('📋 Credenciales:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: admin123\n');
        console.log('⚠️  IMPORTANTE:');
        console.log('   Por seguridad, cambie la contraseña después del primer inicio de sesión.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

createAdmin();
