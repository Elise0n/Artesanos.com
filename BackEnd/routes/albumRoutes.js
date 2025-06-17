const express = require('express');
const router = express.Router();
const Album = require('../models/albumModel');
const { verIndice, verAlbum } = require('../controllers/albumesController');
const { crearAlbum, formularioCrearAlbum, mostrarAlbum } = require('../controllers/albumesController');
const { mostrarFeedAlbumes } = require('../controllers/albumesController');
const { formularioEditarAlbum, editarAlbum, eliminarAlbum } = require('../controllers/albumesController');

// ============================
// Mostrar albumes del usuario logueado
// ============================
router.get('/', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  verIndice(req, res);
});

// ============================
// Rutas para editar y eliminar album
// ============================
router.get('/editar/:id', formularioEditarAlbum);
router.post('/editar/:id', editarAlbum);
router.post('/eliminar/:id', eliminarAlbum);

// ============================
// Formulario para crear album
// ============================
router.get('/crear', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  res.render('crearAlbum');
});

router.get('/crear', formularioCrearAlbum);
router.get('/:id', mostrarAlbum);

// ============================
// Guardar nuevo album en BD
// ============================
router.post('/crear', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const data = {
    titulo: req.body.titulo,
    usuario_id: req.session.usuario.id
  };

  crearAlbum(data, (err) => {
    if (err) {
      console.error('Error al crear álbum:', err);
      return res.status(500).send('Error al crear álbum');
    }
    res.redirect('/perfil');
  });
});

// ============================
// Feed de albumes visibles
// ============================

router.get('/feed', mostrarFeedAlbumes);

router.get('/:id', verAlbum);

export default router;

// ============================
// Funciones para editar y eliminar album
// ============================

// Muestra el formulario con datos actuales del álbum
export const formularioEditarAlbum = async (req, res) => {
  const { id } = req.params;
  const usuario = req.session.usuario;

  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id_usuario) {
    return res.status(403).render('error403');
  }

  res.render('albumes/editarAlbum', { album });
};

// Procesa la edición del álbum
export const editarAlbum = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, visibilidad } = req.body;
  const usuario = req.session.usuario;

  // Verificar propiedad del álbum
  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id_usuario) {
    return res.status(403).render('error403');
  }

  await pool.query(`
    UPDATE album SET titulo = ?, descripcion = ?, visibilidad = ? WHERE id_album = ?
  `, [titulo, descripcion, visibilidad, id]);

  res.redirect('/perfil');
};

// Eliminar álbum
export const eliminarAlbum = async (req, res) => {
  const { id } = req.params;
  const usuario = req.session.usuario;

  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id_usuario) {
    return res.status(403).render('error403');
  }

  await pool.query('DELETE FROM album WHERE id_album = ?', [id]);

  res.redirect('/perfil');
};
