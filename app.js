// app.js
const express = require('express');
const app = express();
const pool = require('./config/db');

require('dotenv').config();
app.use(express.json());

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
