import { pool } from './BackEnd/config/db.js';

const testDB = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuario');
    console.log('🟢 Conexión exitosa. Usuarios encontrados:', rows.length);
  } catch (error) {
    console.error('🔴 Error al conectar:', error.message);
  }
};

testDB();
