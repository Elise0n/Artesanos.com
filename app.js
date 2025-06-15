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
app.use('/imagenes', comentarioLikeRoutes); // Comentarios y likes
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

// Formulario de registro
app.get('/registrar', (req, res) => {
  res.render('crear');
});

// Formulario de login
app.get('/iniciar-sesion', (req, res) => {
  res.render('login');
});

// Vista de perfil
app.get('/perfil', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');

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
app.post('/iniciar-sesion', async (req, res) => {
  const { email, contraseña } = req.body;

  pool.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, resultados) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      return res.status(500).send('Error interno');
    }

    if (resultados.length === 0) {
      return res.status(401).send('Credenciales incorrectas');
    }

    const usuario = resultados[0];
    const passwordValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!passwordValida) {
      return res.status(401).send('Credenciales incorrectas');
    }

    // Guardamos en sesión
    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email
    };

    res.redirect('/perfil');
  });
});

// Cerrar sesión
app.post('/cerrar-sesion', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Registrar nuevo usuario
app.post('/registrar', async (req, res) => {
  const datos = req.body;

  pool.query('SELECT * FROM usuario WHERE email = ?', [datos.email], async (err, resultados) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return res.status(500).send('Error al verificar usuario');
    }

    if (resultados.length > 0) {
      return res.status(400).send('El correo ya está registrado');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      datos.contraseña = await bcrypt.hash(datos.contraseña, salt);

      Usuario.crear(datos, (err, resultado) => {
        if (err) {
          console.error('Error al registrar usuario:', err);
          return res.status(500).send('Error al registrar usuario');
        }
        res.redirect('/');
      });
    } catch (error) {
      console.error('Error al hashear contraseña:', error);
      res.status(500).send('Error al registrar usuario');
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