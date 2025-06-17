const pool = require('../config/db');

const Imagen = {
  //Insertar imagen
  crear: (data, callback) => {
    const sql = 'INSERT INTO imagen (titulo, ruta, album_id, solo_amigos) VALUES (?, ?, ?, ?)';
    pool.query(sql, [data.titulo, data.ruta, data.album_id, data.solo_amigos], callback);
  },

  //Obtener imágenes visibles según si son públicas o compartidas con el usuario
  obtenerPorAlbum: (albumId, usuarioId, callback) => {
    const sql = `
      SELECT i.*,(SELECT COUNT(*) FROM me_gusta g WHERE g.id_imagen = i.id_imagen
      ) AS totalLikes
      FROM imagen i
      LEFT JOIN imagen_usuario_compartida c ON i.id_imagen = c.id_imagen AND c.id_usuario = ?
    WHERE (i.visibilidad = 'publica' OR i.id_usuario = ? OR EXISTS (
      SELECT 1 FROM imagen_usuario_compartida c WHERE c.id_imagen = i.id_imagen AND c.id_usuario = ?
    ))
    `;
    pool.query(sql, [usuarioId, albumId, usuarioId], callback);
  }
};  

module.exports = Imagen;
