export const verIndice = (req, res) => {
    res.render('albumes');
  };
  
export const verAlbum = (req, res) => {
    const id = req.params.id;
    res.render(`albumes/album${id}`);
  };

  // Muestra formulario para crear álbum
  export const formularioCrearAlbum = (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    res.render('crearAlbum');
  };
  
  // Guarda nuevo álbum en la BD
export const crearAlbum = async (req, res) => {
    const { titulo, descripcion, visibilidad } = req.body;
    const id_usuario = req.session.usuario.id_usuario;
  
    await pool.query(`
      INSERT INTO album (id_usuario, titulo, descripcion, visibilidad)
      VALUES (?, ?, ?, ?)
    `, [id_usuario, titulo, descripcion, visibilidad]);
  
    res.redirect('/perfil'); // o a la vista del nuevo álbum
  };
  
  // Muestra un álbum específico
export const mostrarAlbum = async (req, res) => {
    const { id } = req.params;
    const usuarioLogueado = req.session.usuario;
  
    const [album] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);
  
    // Suponiendo que tengas una función para validar amistad
    const esAmigo = await verificarAmistad(album.id_usuario, usuarioLogueado?.id_usuario);
    const permitido = (album.visibilidad === 'publico') || esAmigo || (usuarioLogueado?.id_usuario === album.id_usuario);
  
    if (!permitido) return res.status(403).render('error403');
  
    const comentarios = await pool.query(`
      SELECT c.*, u.nombre FROM comentario_album c
      JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE c.id_album = ?
      ORDER BY c.fecha ASC
    `, [id]);
  
    res.render('albumes/verAlbum', { album, comentarios, usuario: req.session.usuario });
  };

  const Amistad = require('../models/amistadModel');
  const pool  = require('../config/db');

  export async function mostrarFeedAlbumes(req, res) {
  const usuario = req.session.usuario;

  let query = `
      SELECT a.*, u.nombre
      FROM album a
      JOIN usuario u ON u.id_usuario = a.id_usuario
      WHERE a.visibilidad = 'publico'
    `;

  const valores = [];

  if (usuario) {
    // también quiero mis álbumes
    query += ` OR a.id_usuario = ?`;
    valores.push(usuario.id_usuario);

    // y los de amigos (visibilidad = 'amigos')
    const [amistades] = await pool.query(`
        SELECT id_emisor, id_receptor FROM solicitud_amistad
        WHERE estado = 'aceptada' AND (id_emisor = ? OR id_receptor = ?)
      `, [usuario.id_usuario, usuario.id_usuario]);

    const idsAmigos = new Set();
    amistades.forEach(row => {
      if (row.id_emisor !== usuario.id_usuario) idsAmigos.add(row.id_emisor);
      if (row.id_receptor !== usuario.id_usuario) idsAmigos.add(row.id_receptor);
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
}

Amistad.sonAmigos(usuarioLogueado.id_usuario, album.id_usuario, (err, esAmigo) => {
  if (err) return res.status(500).send('Error al verificar amistad');

  const permitido = album.visibilidad === 'publico' || esAmigo || (usuarioLogueado.id_usuario === album.id_usuario);

  if (!permitido) return res.status(403).render('error403');

  // continuar mostrando el álbum...
});

export async function formularioEditarAlbum(req, res) {
    const { id } = req.params;
    const usuario = req.session.usuario;

    const [album] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);

    if (!album || album.id_usuario !== usuario.id_usuario) {
        return res.status(403).render('error403');
    }

    res.render('albumes/editarAlbum', { album });
}

export async function editarAlbum(req, res) {
    const { id } = req.params;
    const { titulo, descripcion, visibilidad } = req.body;
    const usuario = req.session.usuario;

    const [album] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);

    if (!album || album.id_usuario !== usuario.id_usuario) {
        return res.status(403).render('error403');
    }

    await pool.query('UPDATE album SET titulo = ?, descripcion = ?, visibilidad = ? WHERE id_album = ?', [titulo, descripcion, visibilidad, id]);

    res.redirect('/perfil');
}

export async function eliminarAlbum(req, res) {
    const { id } = req.params;
    const usuario = req.session.usuario;

    const [album] = await pool.query('SELECT * FROM album WHERE id_album = ?', [id]);

    if (!album || album.id_usuario !== usuario.id_usuario) {
        return res.status(403).render('error403');
    }

    await pool.query('DELETE FROM album WHERE id_album = ?', [id]);

    res.redirect('/perfil');
}

