
const express = require('express');
const router = express.Router();
const authController = require('./BackEnd/controllers/authController');

// Rutas de autenticación
router.get('/login', authController.vistaLogin);
router.post('/login', authController.login);
router.get('/registro', authController.vistaRegistro);
router.post('/registro', authController.registrar);
router.get('/logout', authController.logout);

module.exports = router;
