const db = require('../config/db');

const Imagen = {
  //Insertar imagen
  crear: (data, callback) => {
    const sql = 'INSERT INTO imagen (titulo, ruta, album_id, solo_amigos) VALUES (?, ?, ?, ?)';
    db.query(sql, [data.titulo, data.ruta, data.album_id, data.solo_amigos], callback);
  },

  //Obtener imágenes visibles según si son públicas o compartidas con el usuario
  obtenerPorAlbum: (albumId, usuarioId, callback) => {
    const sql = `
      SELECT i.*,(SELECT COUNT(*) FROM me_gusta g WHERE g.imagen_id = i.id_imagen
      ) AS totalLikes
      FROM imagen i
      LEFT JOIN imagen_usuario_compartida c ON i.id_imagen = c.imagen_id AND c.usuario_id = ?
      WHERE i.album_id = ?
        AND (i.solo_amigos = 0 OR c.usuario_id IS NOT NULL)
    `;
    db.query(sql, [usuarioId, albumId], callback);
  }
};

module.exports = Imagen;
