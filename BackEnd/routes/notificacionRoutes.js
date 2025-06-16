const express = require('express');
const router = express.Router();
const Notificacion = require('./BackEnd/models/notificacionModel');

// Ver notificaciones
router.get('/', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

  Notificacion.obtenerNoVistas(req.session.usuario.id, (err, notis) => {
    if (err) return res.status(500).send('Error al cargar notificaciones');
    res.render('notificaciones', { notificaciones: notis });
  });
});

// Marcar todas como vistas
router.post('/marcar-vistas', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

  Notificacion.marcarComoVistas(req.session.usuario.id, () => {
    res.redirect('/notificaciones');
  });
});

module.exports = router;
