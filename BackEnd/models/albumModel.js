const db = require('./BackEnd/config/db');

const Album = {
  // Crear un nuevo álbum
  crear: (data, callback) => {
    const sql = 'INSERT INTO album (titulo, usuario_id) VALUES (?, ?)';
    db.query(sql, [data.titulo, data.usuario_id], callback);
  },

  // Obtener todos los álbumes de un usuario
  obtenerPorUsuario: (usuarioId, callback) => {
    const sql = 'SELECT * FROM album WHERE usuario_id = ?';
    db.query(sql, [usuarioId], callback);
  }
};

module.exports = Album;
