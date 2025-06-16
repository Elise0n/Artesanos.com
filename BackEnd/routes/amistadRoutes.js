const express = require('express');
const router = express.Router();
const Amistad = require('./BackEnd/models/amistadModel');
const Notificacion = require('./BackEnd/models/notificacionModel');

//Enviar solicitud de amistad
router.post('/enviar', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');
  const remitente = req.session.usuario.id;
  const destinatario = req.body.destinatario_id;

  Amistad.enviar(remitente, destinatario, (err) => {
    if (!err) {
      // 🔔 Notificar al destinatario
      Notificacion.crear(destinatario, 'amistad', `Recibiste una solicitud de ${req.session.usuario.nombre}`, () => {});
    }
    res.redirect('back');
  });
});

//Ver solicitudes pendientes
router.get('/pendientes', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

  Amistad.recibidas(req.session.usuario.id, (err, solicitudes) => {
    if (err) return res.status(500).send('Error al cargar solicitudes');
    res.render('solicitudes', { solicitudes });
  });
});

//Aceptar o Rechazar solicitud
router.post('/responder', (req, res) => {
  const { solicitud_id, accion } = req.body; // 'aceptada' o 'rechazada'

  Amistad.actualizarEstado(solicitud_id, accion, () => {
    res.redirect('/amistades/pendientes');
  });
});

module.exports = router;
