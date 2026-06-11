const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'barbermaster',
  password: process.env.DB_PASSWORD || 'barbermaster123',
  database: process.env.DB_NAME || 'barbermaster_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configurar zona horaria para todas las conexiones del pool
// Esto asegura que CURRENT_DATE, NOW(), etc. usen la hora local de Colombia
pool.on('connect', (client) => {
  client.query("SET timezone TO 'America/Bogota'").catch(err => {
    console.error('Error setting timezone:', err.message);
  });
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
