const express = require('express');
const router = express.Router();
const pool = require('../config/db');

//Guardar comentario o like
router.post('/comentar/like', (req, res) => {
  const { imagen_id, contenido } = req.body;
  const usuario_id = req.session?.usuario?.id_usuario;

  if (!usuario_id) return res.redirect('/iniciar-sesion');

  //Si hay contenido, es comentario. Si no, es solo like
  if (contenido && contenido.trim() !== '') {
    const sql = 'INSERT INTO comentario (imagen_id, usuario_id, contenido) VALUES (?, ?, ?)';
    pool.query(sql, [imagen_id, usuario_id, contenido], (err) => {
      if (err) {
        console.error('Error al comentar:', err);
        return res.status(500).send('Error al comentar');
      }
      res.redirect('back');
    });
  } else {
    //Like (prevenir duplicado)
    const sql = 'INSERT IGNORE INTO like_imagen (imagen_id, usuario_id) VALUES (?, ?)';
    pool.query(sql, [imagen_id, usuario_id], (err) => {
      if (err) {
        console.error('Error al dar like:', err);
        return res.status(500).send('Error al dar like');
      }
      res.redirect('back');
    });
  }
});

module.exports = router;
