const pool = require('../config/db');

const Notificacion = {
  //Crear una nueva notificación
  crear: (usuario_id, tipo, mensaje, callback) => {
    const sql = 'INSERT INTO notificacion (usuario_id, tipo, mensaje) VALUES (?, ?, ?)';
    pool.query(sql, [usuario_id, tipo, mensaje], callback);
  },

  //Obtener notificaciones no vistas
  obtenerNoVistas: (usuarioId, callback) => {
    const sql = 'SELECT * FROM notificacion WHERE usuario_id = ? AND vista = FALSE ORDER BY fecha DESC';
    pool.query(sql, [usuarioId], callback);
  },

  //Marcar como vistas
  marcarComoVistas: (usuarioId, callback) => {
    const sql = 'UPDATE notificacion SET vista = TRUE WHERE usuario_id = ?';
    pool.query(sql, [usuarioId], callback);
  }
};

module.exports = Notificacion;
