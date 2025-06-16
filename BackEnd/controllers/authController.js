
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Mostrar login
exports.vistaLogin = (req, res) => {
  res.render('login');
};

// Mostrar registro
exports.vistaRegistro = (req, res) => {
  res.render('registro');
};

// Registro
exports.registrar = async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  const hash = await bcrypt.hash(contraseña, 10);

  try {
    await pool.query('INSERT INTO usuario (nombre, email, contraseña) VALUES (?, ?, ?)', [nombre, email, hash]);
    res.redirect('/login');
  } catch (err) {
    res.status(500).send('Error al registrar');
  }
};

// Login con JWT
exports.login = async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
    const usuario = rows[0];

    if (!usuario) return res.status(401).send('Usuario no encontrado');

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) return res.status(401).send('Contraseña incorrecta');

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, 'secreto_jwt', { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error en el login');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};
