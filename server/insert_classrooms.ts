import pool from './db';
import { RowDataPacket } from 'mysql2';

const classrooms = [
    // AULAS TEÓRICAS EPI (Teoría y Práctica)
    { code: 'POOL-17', name: 'POOL-17', type: 'Teoría', typeIdx: 1, capacity: 35, building: 'Pabellón Pool de Aulas', floor: 1 },
    { code: 'POOL-18', name: 'POOL-18', type: 'Teoría', typeIdx: 1, capacity: 35, building: 'Pabellón Pool de Aulas', floor: 1 },
    { code: 'INFO-2',  name: 'INFO-2',  type: 'Teoría', typeIdx: 1, capacity: 25, building: 'Pabellón de Informática', floor: 1 },
    { code: 'INFO-3',  name: 'INFO-3',  type: 'Teoría', typeIdx: 1, capacity: 25, building: 'Pabellón de Informática', floor: 1 },
    { code: 'INFO-5',  name: 'INFO-5',  type: 'Teoría', typeIdx: 1, capacity: 25, building: 'Pabellón de Informática', floor: 2 },

    // LABORATORIOS ESPECIALIZADOS EPI (Laboratorio 4h)
    { code: 'LAB-A',   name: 'LAB-A',   type: 'Laboratorio', typeIdx: 2, capacity: 40, building: 'Pabellón de Informática', floor: 2 },
    { code: 'LAB-B',   name: 'LAB-B',   type: 'Laboratorio', typeIdx: 2, capacity: 40, building: 'Pabellón de Informática', floor: 2 },
    { code: 'LAB-C',   name: 'LAB-C',   type: 'Laboratorio', typeIdx: 2, capacity: 40, building: 'Pabellón de Informática', floor: 2 },
];

async function insertClassrooms() {
    try {
        console.log('🏫 CONFIGURANDO AULAS REALES EPI-UNT EN LA BASE DE DATOS\n');
        console.log('='.repeat(70));

        const validNames = classrooms.map(c => c.name);
        await pool.query('DELETE FROM classrooms WHERE name NOT IN (?)', [validNames]);

        let inserted = 0;
        let updated = 0;

        for (const classroom of classrooms) {
            const [existing] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM classrooms WHERE name = ?',
                [classroom.name]
            );
            if (existing.length > 0) {
                await pool.query(
                    'UPDATE classrooms SET type = ?, capacity = ? WHERE id = ?',
                    [classroom.typeIdx, classroom.capacity, existing[0].id]
                );
                updated++;
                console.log(`🔄 Actualizada: ${classroom.name} (${classroom.type}, Cap: ${classroom.capacity})`);
            } else {
                await pool.query(
                    'INSERT INTO classrooms (name, type, capacity) VALUES (?, ?, ?)',
                    [classroom.name, classroom.typeIdx, classroom.capacity]
                );
                inserted++;
                console.log(`✅ Insertada: ${classroom.name} (${classroom.type}, Cap: ${classroom.capacity})`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log(`📊 Resumen: ${inserted} insertadas, ${updated} actualizadas. Total EPI: ${classrooms.length} aulas.`);
        await pool.end();
    } catch (error) {
        console.error('❌ Error general:', error);
        await pool.end();
        process.exit(1);
    }
}

insertClassrooms();
