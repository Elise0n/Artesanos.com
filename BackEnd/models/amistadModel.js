const pool = require('../config/db');

const Amistad = {
  // Enviar solicitud
  enviar: (de, para, callback) => {
    const sql = 'INSERT INTO solicitud_amistad (de_usuario, para_usuario, estado) VALUES (?, ?, "pendiente")';
    pool.query(sql, [de, para], callback);
  },

  // Aceptar solicitud
  aceptar: (de, para, callback) => {
    const sql = 'UPDATE solicitud_amistad SET estado = "aceptada" WHERE de_usuario = ? AND para_usuario = ?';
    pool.query(sql, [de, para], callback);
  },

  // Rechazar solicitud
  rechazar: (de, para, callback) => {
    const sql = 'UPDATE solicitud_amistad SET estado = "rechazada" WHERE de_usuario = ? AND para_usuario = ?';
    query(sql, [de, para], callback);
  },

  // Ver solicitudes recibidas
  recibidas: (usuarioId, callback) => {
    const sql = `
      SELECT s.*, u.nombre, u.apellido
      FROM solicitud_amistad s
      JOIN usuario u ON s.de_usuario = u.id_usuario
      WHERE s.para_usuario = ? AND s.estado = "pendiente"
    `;
    pool.query(sql, [usuarioId], callback);
  }
};

module.exports = Amistad;
