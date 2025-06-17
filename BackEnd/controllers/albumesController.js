const pool = require('../config/db');
const Amistad = require('../models/amistadModel');

const verIndice = (req, res) => {
  res.render('albumes');
};

const verAlbum = (req, res) => {
  const id = req.params.id;
  res.render(`albumes/album${id}`);
};

const formularioCrearAlbum = (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  res.render('crearAlbum');
};

const crearAlbum = async (req, res) => {
  const { titulo, descripcion, visibilidad } = req.body;
  const id_usuario = req.session.usuario.id;

  await pool.query(`
    INSERT INTO album (id_usuario, titulo, descripcion, visibilidad)
    VALUES (?, ?, ?, ?)
  `, [id_usuario, titulo, descripcion, visibilidad]);

  res.redirect('/perfil');
};

const mostrarAlbum = async (req, res) => {
  const { id } = req.params;
  const usuarioLogueado = req.session.usuario;

  const [albumResult] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = albumResult[0];

  if (!album) return res.status(404).render('error404');

  const idUsuarioLogueado = usuarioLogueado?.id ?? null;

  Amistad.sonAmigos(idUsuarioLogueado, album.id_usuario, async (err, esAmigo) => {
    if (err) return res.status(500).send('Error al verificar amistad');

    const permitido =
      album.visibilidad === 'publico' ||
      esAmigo ||
      idUsuarioLogueado === album.id_usuario;

    if (!permitido) return res.status(403).render('error403');

    const [comentarios] = await pool.query(`
      SELECT c.*, u.nombre FROM comentario_album c
      JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE c.id_album = ?
      ORDER BY c.fecha ASC
    `, [id]);

    res.render('albumes/verAlbum', {
      album,
      comentarios,
      usuario: usuarioLogueado
    });
  });
};

const mostrarFeedAlbumes = async (req, res) => {
  const usuario = req.session.usuario;
  let query = `
    SELECT a.*, u.nombre
    FROM album a
    JOIN usuario u ON u.id_usuario = a.id_usuario
    WHERE a.visibilidad = 'publico'
  `;
  const valores = [];

  if (usuario) {
    query += ` OR a.id_usuario = ?`;
    valores.push(usuario.id);

    const [amistades] = await pool.query(`
      SELECT id_emisor, id_receptor FROM solicitud_amistad
      WHERE estado = 'aceptada' AND (id_emisor = ? OR id_receptor = ?)
    `, [usuario.id, usuario.id]);

    const idsAmigos = new Set();
    amistades.forEach(row => {
      if (row.id_emisor !== usuario.id) idsAmigos.add(row.id_emisor);
      if (row.id_receptor !== usuario.id) idsAmigos.add(row.id_receptor);
    });

    if (idsAmigos.size > 0) {
      const placeholders = Array.from(idsAmigos).map(() => '?').join(',');
      query += ` OR (a.id_usuario IN (${placeholders}) AND a.visibilidad = 'amigos')`;
      valores.push(...idsAmigos);
    }
  }

  query += ` ORDER BY a.fecha_creacion DESC`;

  const [albumes] = await pool.query(query, valores);
  res.render('albumes/feed', { albumes, usuario });
};

const formularioEditarAlbum = async (req, res) => {
  const { id } = req.params;
  const usuario = req.session.usuario;

  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id) {
    return res.status(403).render('error403');
  }

  res.render('albumes/editarAlbum', { album });
};

const editarAlbum = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, visibilidad } = req.body;
  const usuario = req.session.usuario;

  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id) {
    return res.status(403).render('error403');
  }

  await pool.query(
    'UPDATE album SET titulo = ?, descripcion = ?, visibilidad = ? WHERE id_album = ?',
    [titulo, descripcion, visibilidad, id]
  );

  res.redirect('/perfil');
};

const eliminarAlbum = async (req, res) => {
  const { id } = req.params;
  const usuario = req.session.usuario;

  const [result] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  const album = result[0];

  if (!album || album.id_usuario !== usuario.id) {
    return res.status(403).render('error403');
  }

  await pool.query('DELETE FROM album WHERE id_album = ?', [id]);

  res.redirect('/perfil');
};

module.exports = {
  verIndice,
  verAlbum,
  formularioCrearAlbum,
  crearAlbum,
  mostrarAlbum,
  mostrarFeedAlbumes,
  formularioEditarAlbum,
  editarAlbum,
  eliminarAlbum
};
