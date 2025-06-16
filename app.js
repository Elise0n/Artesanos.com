 // ==========================
// 📦 Importaciones
// ==========================
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const pool = require('./BackEnd/config/db');
const Usuario = require('./BackEnd/models/usuarioModel');
const usuarioRoutes = require('./BackEnd/routes/usuarioRoutes');
const albumRoutes = require('./BackEnd/routes/albumRoutes');
const multer = require('multer');
const imagenRoutes = require('./BackEnd/routes/imagenRoutes');
const notificacionRoutes = require('./BackEnd/routes/notificacionRoutes');
require('dotenv').config();
const amistadRoutes = require('./BackEnd/routes/amistadRoutes');
const comentarioLikeRoutes = require('./BackEnd/routes/comentarioLikeRoutes');
// ==========================
// ⚙️ Configuraciones generales
// ==========================
app.set('view engine', 'pug'); // Motor de plantillas
app.set('views', './FrontEnd/views'); // Ruta de vistas Pug

app.use(express.urlencoded({ extended: true })); // Formularios HTML
app.use(express.json());                         // JSON en requests
app.use('/css', express.static(__dirname + '/FrontEnd/css'));
app.use('/js', express.static(__dirname + '/FrontEnd/js'));
app.use('/albumes', albumRoutes);
app.use('/imagenes', imagenRoutes);
app.use('/comentarios', comentarioLikeRoutes); // Comentarios y likes
app.use('/uploads', express.static(__dirname + '/FrontEnd/uploads'));
app.use('/notificaciones', notificacionRoutes);
app.use('/amistades', amistadRoutes);

// ==========================
// 🛡️ Configuración de sesiones
// ==========================
app.use(session({
  secret: 'secreto_seguro', //Cambiar en producción
  resave: false,
  saveUninitialized: false
}));

// Middleware para usar datos del usuario en todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// ==========================
// 🌐 Rutas públicas (Frontend)
// ==========================

// Página de inicio
app.get('/', (req, res) => {
  res.render('inicio');
});

// Lista de usuarios (vista)
app.get('/usuarios', (req, res) => {
  Usuario.obtenerTodos((err, usuarios) => {
    if (err) return res.status(500).send('Error al obtener usuarios');
    res.render('usuarios', { usuarios });
  });
});

// Formulario de registro
app.get('/registro', (req, res) => {
  res.render('registro', { error: null, exito: null });
});

// Formulario de login
app.get('/login', (req, res) => {
  res.render('login', { error: null, exito: null });
});

// Vista de perfil logeado
app.get('/perfil', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const sql = 'SELECT * FROM album WHERE usuario_id = ?';
  pool.query(sql, [req.session.usuario.id], (err, albumes) => {
    if (err) {
      console.error('Error al obtener álbumes:', err);
      return res.status(500).send('Error al cargar perfil');
    }
    res.render('perfil', {
      usuario: req.session.usuario,
      albumes
    });
  });
});

// ==========================
// 🧠 Autenticación y Registro
// ==========================

// Procesar login
app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;

  pool.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, resultados) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      return res.render('login', { error: 'Error en el servidor', exito: null });
    }

    if (resultados.length === 0) {
      return res.render('login', { error: 'Correo o contraseña incorrectos', exito: null });
    }

    const usuario = resultados[0];
    const esValido = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!esValido) {
      return res.render('login', { error: 'Correo o contraseña incorrectos', exito: null });
    }

    // Guardamos en sesión
    req.session.usuario = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email
    };

    res.redirect('/perfil');
  });
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});
app.post('/cerrar-sesion', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Registrar nuevo usuario
app.post('/registro', async (req, res) => {
  const datos = req.body;

  pool.query('SELECT * FROM usuario WHERE email = ?', [datos.email], async (err, resultados) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return res.render('registro', { error: 'Error al verificar usuario', exito: null });
    }

    if (resultados.length > 0) {
      return res.render('registro', { error: 'El correo ya está registrado', exito: null });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      datos.contraseña = await bcrypt.hash(datos.contraseña, salt);

      Usuario.crear(datos, (err, resultado) => {
        if (err) {
          console.error('Error al registrar usuario:', err);
          return res.render('registro', { error: 'Error al registrar usuario', exito: null });
        }
        res.render('login', { error: null, exito: '¡Registro exitoso! Ahora puedes iniciar sesión.' });
      });
    } catch (err) {
      res.render('registro', { error: 'Error al registrar usuario', exito: null });
    }
  });
});

// ==========================
// 🔧 Rutas API y de prueba
// ==========================
app.use('/api/usuario', usuarioRoutes); // Rutas CRUD API REST

app.get('/ping-db', (req, res) => {
  pool.query('SELECT 1 + 1 AS resultado', (err, results) => {
    if (err) {
      console.error('Error de conexión a la base de datos:', err);
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
    res.json({ ok: true, resultado: results[0].resultado });
  });
});

// ==========================
// 🚀 Iniciar servidor
// ==========================
console.log("DB:", process.env.DB_HOST);

const PORT = process.env.PORT || 8100;
app.listen(PORT, '::', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './FrontEnd/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Buscar
app.get('/buscar', (req, res) => {
  const { q, filtro } = req.query;

  if (!q || !filtro) return res.redirect('/');

  let sql = '';
  let params = [`%${q}%`];

  switch (filtro) {
    case 'usuario':
      sql = 'SELECT id, nombre, apellido FROM usuario WHERE nombre LIKE ? OR apellido LIKE ?';
      params = [ `%${q}%`, `%${q}%` ];
      break;
    case 'album':
      sql = 'SELECT id, titulo FROM album WHERE titulo LIKE ?';
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


const upload = multer({ storage });