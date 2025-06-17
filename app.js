// ==========================
// 📦 Importaciones
// ==========================
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('dotenv').config();


// Rutas y modelos
const pool = require('./BackEnd/config/db');
const Usuario = require('./BackEnd/models/usuarioModel');
const usuarioRoutes = require('./BackEnd/routes/usuarioRoutes');
const albumRoutes = require('./BackEnd/routes/albumRoutes');
const imagenRoutes = require('./BackEnd/routes/imagenRoutes');
const notificacionRoutes = require('./BackEnd/routes/notificacionRoutes');
const amistadRoutes = require('./BackEnd/routes/amistadRoutes');
const comentarioLikeRoutes = require('./BackEnd/routes/comentarioLikeRoutes');

// ==========================
// 🎞️ Configuración de multer
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './FrontEnd/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==========================
// ⚙️ Configuraciones generales
// ==========================
app.set('view engine', 'pug');
app.set('views', './FrontEnd/views');
app.set('io', io);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/css', express.static(__dirname + '/FrontEnd/css'));
app.use('/js', express.static(__dirname + '/FrontEnd/js'));
app.use('/uploads', express.static(__dirname + '/FrontEnd/uploads'));

// ==========================
// 🛡️ Sesión
// ==========================
app.use(session({
  secret: 'secreto_seguro',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// ==========================
// 📁 Rutas
// ==========================
app.use('/albumes', albumRoutes);
app.use('/imagenes', imagenRoutes);
app.use('/comentarios', comentarioLikeRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/amistades', amistadRoutes);
app.use('/api/usuario', usuarioRoutes);

// ==========================
// 🌐 Rutas públicas
// ==========================
app.get('/', (req, res) => res.render('inicio'));

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.render('usuarios', { usuarios });
  } catch (err) {
    res.status(500).send('Error al obtener usuarios');
  }
});

app.get('/registro', (req, res) => res.render('registro', { error: null, exito: null }));
app.get('/login', (req, res) => res.render('login', { error: null, exito: null }));

app.get('/perfil', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  pool.query('SELECT * FROM album WHERE id_usuario = ?', [req.session.usuario.id], (err, albumes) => {
    if (err) return res.status(500).send('Error al cargar perfil');
    res.render('perfil', { usuario: req.session.usuario, albumes });
  });
});

app.get('/editar-perfil', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  res.render('editar-perfil', { usuario: req.session.usuario });
});

app.post('/editar-perfil', upload.single('imagen_perfil'), (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const { nombre, apellido, intereses, antecedentes } = req.body;
  const usuario_id = req.session.usuario.id;
  const imagen = req.file ? '/uploads/' + req.file.filename : null;

  const sql = `
    UPDATE usuario
    SET nombre = ?, apellido = ?, intereses = ?, antecedentes = ?
    ${imagen ? ', imagen_perfil = ?' : ''}
    WHERE id_usuario = ?
  `;
  const params = imagen
    ? [nombre, apellido, intereses, antecedentes, imagen, usuario_id]
    : [nombre, apellido, intereses, antecedentes, usuario_id];

  pool.query(sql, params, err => {
    if (err) return res.status(500).send('Error al actualizar perfil');

    // Actualizar sesión
    Object.assign(req.session.usuario, { nombre, apellido, intereses, antecedentes });
    if (imagen) req.session.usuario.imagen_perfil = imagen;

    res.redirect('/perfil');
  });
});

app.get('/galeria', (req, res) => {
  const sql = `
    SELECT i.*, u.nombre, u.apellido
    FROM imagen i
    JOIN usuario u ON i.id_album IS NOT NULL AND i.visibilidad = 'publica'
    ORDER BY i.id_imagen DESC
  `;
  pool.query(sql, (err, imagenes) => {
    if (err) return res.status(500).send('Error al cargar galería');
    res.render('galeria', { imagenes });
  });
});

app.get('/buscar', (req, res) => {
  const { q, filtro } = req.query;
  if (!q || !filtro) return res.redirect('/');

  let sql = '';
  let params = [`%${q}%`];

  switch (filtro) {
    case 'usuario':
      sql = 'SELECT id_usuario, nombre, apellido FROM usuario WHERE nombre LIKE ? OR apellido LIKE ?';
      params = [ `%${q}%`, `%${q}%` ];
      break;
    case 'album':
      sql = 'SELECT id_usuario, titulo FROM album WHERE titulo LIKE ?';
      break;
    case 'etiqueta':
      sql = `
        SELECT e.nombre, i.ruta 
        FROM etiqueta e
        JOIN imagen_etiqueta ie ON e.id = ie.etiqueta_id
        JOIN imagen i ON ie.imagen_id = i.id
        WHERE e.nombre LIKE ?
      `;
      break;
    default:
      return res.redirect('/');
  }

  pool.query(sql, params, (err, resultados) => {
    if (err) return res.status(500).send('Error en búsqueda');
    res.render('resultados', { resultados, filtro, q });
  });
});

// ==========================
// 🔐 Autenticación
// ==========================
app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  pool.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) {
      return res.render('login', { error: 'Correo o contraseña incorrectos', exito: null });
    }

    const usuario = resultados[0];
    const esValido = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!esValido) {
      return res.render('login', { error: 'Correo o contraseña incorrectos', exito: null });
    }

    req.session.usuario = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      imagen_perfil: usuario.imagen_perfil || null
    };
    console.log('✅ Usuario logueado:', req.session.usuario);
    res.redirect('/perfil');
  });
});

app.post('/registro', async (req, res) => {
  const datos = req.body;
  pool.query('SELECT * FROM usuario WHERE email = ?', [datos.email], async (err, resultados) => {
    if (resultados.length > 0) {
      return res.render('registro', { error: 'El correo ya está registrado', exito: null });
    }

    const salt = await bcrypt.genSalt(10);
    datos.contraseña = await bcrypt.hash(datos.contraseña, salt);
    Usuario.crear(datos, (err) => {
      if (err) return res.render('registro', { error: 'Error al registrar usuario', exito: null });
      res.render('login', { error: null, exito: '¡Registro exitoso!' });
    });
  });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.post('/cerrar-sesion', (req, res) => req.session.destroy(() => res.redirect('/')));

// ==========================
// 🧪 Ruta de prueba
// ==========================
app.get('/ping-db', (req, res) => {
  pool.query('SELECT 1 + 1 AS resultado', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ ok: true, resultado: results[0].resultado });
  });
});

// ==========================
// 🚀 Iniciar servidor
// ==========================
console.log("DB:", process.env.DB_HOST);

const PORT = process.env.PORT || 8100;
http.listen(PORT, () => {
  io.on('connection', socket => {
    console.log('🟢 Usuario conectado a comentarios');

    socket.on('nuevo_comentario', data => {
      socket.broadcast.emit('comentario_recibido', data);
    });
  });
});
