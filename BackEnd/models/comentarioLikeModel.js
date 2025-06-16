const pool = require('../config/db');

const Comentario = {
 // Crear nuevo comentario
  crear: (data, callback) => {
    const sql = 'INSERT INTO comentario (contenido, usuario_id, imagen_id) VALUES (?, ?, ?)';
    pool.query(sql, [data.contenido, data.usuario_id, data.imagen_id], callback);
  },

  // Obtener comentarios por imagen
  obtenerPorImagen: (imagenId, callback) => {
    const sql = `
      SELECT comentario.*, usuario.nombre 
      FROM comentario 
      JOIN usuario ON comentario.usuario_id = usuario.id
      WHERE imagen_id = ?
      ORDER BY fecha DESC
    `;
    pool.query(sql, [imagenId], callback);
  }
};

module.exports = Comentario;
