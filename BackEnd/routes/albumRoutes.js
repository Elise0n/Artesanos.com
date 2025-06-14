const express = require('express');
const router = express.Router();
const Album = require('../models/albumModel');

// ============================
// Mostrar álbumes del usuario logueado
// ============================
router.get('/', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

  Album.obtenerPorUsuario(req.session.usuario.id, (err, albumes) => {
    if (err) {
      console.error('Error al obtener álbumes:', err);
      return res.status(500).send('Error al cargar álbumes');
    }
    res.render('albumes', { albumes });
  });
});

// ============================
// Formulario para crear álbum
// ============================
router.get('/crear', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');
  res.render('crearAlbum');
});

// ============================
// Guardar nuevo álbum en BD
// ============================
router.post('/crear', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

  const data = {
    titulo: req.body.titulo,
    usuario_id: req.session.usuario.id
  };

  Album.crear(data, (err) => {
    if (err) {
      console.error('Error al crear álbum:', err);
      return res.status(500).send('Error al crear álbum');
    }
    res.redirect('/perfil');
  });
});

module.exports = router;
