const pool = require('../config/db');

const Amistad = {
  // Enviar solicitud
  enviar: (de, para, callback) => {
    const sql = 'INSERT INTO solicitud_amistad (id_emisor, id_receptor, estado) VALUES (?, ?, "pendiente")';
    pool.query(sql, [de, para], callback);
  },

  // Aceptar solicitud
  aceptar: (de, para, callback) => {
    const sql = 'UPDATE solicitud_amistad SET estado = "aceptada" WHERE id_emisor = ? AND id_receptor = ?';
    pool.query(sql, [de, para], callback);
  },

  // Rechazar solicitud
  rechazar: (de, para, callback) => {
    const sql = 'UPDATE solicitud_amistad SET estado = "rechazada" WHERE id_emisor = ? AND id_receptor = ?';
    pool.query(sql, [de, para], callback);
  },

  // Ver solicitudes recibidas
  recibidas: (usuarioId, callback) => {
    const sql = `
      SELECT s.*, u.nombre, u.apellido
      FROM solicitud_amistad s
      JOIN usuario u ON s.id_emisor = u.id_usuario
      WHERE s.id_receptor = ? AND s.estado = "pendiente"
    `;
    pool.query(sql, [usuarioId], callback);
  },

  // Actualizar estado desde el id_solicitud
  actualizarEstado: (solicitud_id, nuevoEstado, callback) => {
    const sql = 'UPDATE solicitud_amistad SET estado = ? WHERE id_solicitud = ?';
    pool.query(sql, [nuevoEstado, solicitud_id], callback);
  },

  // Verifica si dos usuarios son amigos
  sonAmigos: (id1, id2, callback) => {
    const sql = `
      SELECT 1 FROM solicitud_amistad
      WHERE estado = "aceptada" AND (
        (id_emisor = ? AND id_receptor = ?) OR
        (id_emisor = ? AND id_receptor = ?)
      ) LIMIT 1
    `;
    pool.query(sql, [id1, id2, id2, id1], (err, results) => {
      if (err) return callback(err, false);
      callback(null, results.length > 0);
    });
  }
};

module.exports = Amistad;
