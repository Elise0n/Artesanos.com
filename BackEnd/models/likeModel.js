const db = require('./BackEnd/config/db');

const Like = {
  //Registrar un "me gusta"
  darLike: (usuarioId, imagenId, callback) => {
    const sql = 'INSERT IGNORE INTO likes (usuario_id, imagen_id) VALUES (?, ?)';
    db.query(sql, [usuarioId, imagenId], callback);
  },

  //Quitar "me gusta"
  quitarLike: (usuarioId, imagenId, callback) => {
    const sql = 'DELETE FROM likes WHERE usuario_id = ? AND imagen_id = ?';
    db.query(sql, [usuarioId, imagenId], callback);
  },

  //Verificar si el usuario dio like
  tieneLike: (usuarioId, imagenId, callback) => {
    const sql = 'SELECT * FROM likes WHERE usuario_id = ? AND imagen_id = ?';
    db.query(sql, [usuarioId, imagenId], callback);
  },

  //Contar likes por imagen
  contarPorImagen: (imagenId, callback) => {
    const sql = 'SELECT COUNT(*) AS total FROM likes WHERE imagen_id = ?';
    db.query(sql, [imagenId], callback);
  }
};

module.exports = Like;
