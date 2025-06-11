// app.js
const express = require('express');
const app = express();
const pool = require('./BackEnd/config/db');

app.get('/ping-db', (req, res) => {
  pool.query('SELECT 1 + 1 AS resultado', (err, results) => {
    if (err) {
      console.error('Error de conexión a la base de datos:', err);
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
    res.json({ ok: true, resultado: results[0].resultado });
  });
});


const usuarioRoutes = require('./BackEnd/routes/usuarioRoutes');

require('dotenv').config();
console.log("DB:", process.env.DB_HOST);
// Middleware para JSON
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes); // Ruta base para usuarios

// Probar conexión con BD
app.get('/ping-db', (req, res) => {
  pool.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
    res.json({ resultado: results[0].result });
  });
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
