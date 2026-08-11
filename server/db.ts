import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env file in server directory
// Note: We might want the .env in server/ or root. 
// Usually root .env is easier for fullstack, but let's stick to server-specific or share.
// Let's assume server Has its own .env or uses the root one.
// Simplest: .env in server directory.
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

export default pool;
