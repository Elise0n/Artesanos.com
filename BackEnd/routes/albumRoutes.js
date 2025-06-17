const express = require('express');
const router = express.Router();
const {
  verIndice,
  mostrarAlbum,
  crearAlbum,
  formularioCrearAlbum,
  mostrarFeedAlbumes,
  formularioEditarAlbum,
  editarAlbum,
  eliminarAlbum
} = require('../controllers/albumesController');

// Feed de álbumes públicos y de amigos (IMPORTANTE: antes que /:id)
router.get('/feed', mostrarFeedAlbumes);

// Formulario y creación de álbum
router.get('/crear', formularioCrearAlbum);
router.post('/crear', crearAlbum);

// Editar y eliminar álbum
router.get('/editar/:id', formularioEditarAlbum);
router.post('/editar/:id', editarAlbum);
router.post('/eliminar/:id', eliminarAlbum);

// Ver álbum por ID
router.get('/:id', mostrarAlbum);

// Página raíz para ver tus álbumes
router.get('/', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  verIndice(req, res);
});

module.exports = router;
