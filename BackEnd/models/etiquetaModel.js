const db = require('../config/db');

const Etiqueta = {
  //Crear etiqueta si no existe
  crearSiNoExiste: (nombre, callback) => {
    const sql = 'INSERT IGNORE INTO etiqueta (nombre) VALUES (?)';
    db.query(sql, [nombre], callback);
  },

  //Asociar etiqueta a imagen
  asociarAImagen: (imagenId, etiquetaNombre, callback) => {
    const buscarIdSql = 'SELECT id_etiqueta FROM etiqueta WHERE nombre = ?';
    db.query(buscarIdSql, [etiquetaNombre], (err, resultados) => {
      if (err) return callback(err);
      const etiquetaId = resultados[0]?.id_etiqueta;
      if (!etiquetaId) return callback(new Error('Etiqueta no encontrada'));

      const asociarSql = 'INSERT IGNORE INTO imagen_etiqueta (imagen_id, etiqueta_id) VALUES (?, ?)';
      db.query(asociarSql, [imagenId, etiquetaId], callback);
    });
  },

  //Obtener etiquetas de una imagen
  obtenerPorImagen: (imagenId, callback) => {
    const sql = `
      SELECT etiqueta.nombre 
      FROM imagen_etiqueta
      JOIN etiqueta ON imagen_etiqueta.etiqueta_id = etiqueta.id_etiqueta
      WHERE imagen_etiqueta.imagen_id = ?
    `;
    db.query(sql, [imagenId], callback);
  }
};

module.exports = Etiqueta;
