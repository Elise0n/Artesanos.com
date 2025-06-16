//routes
const express = require('express');
const router = express.Router();
const usuarioController = require('./BackEnd/controllers/usuarioController');

//Rutas para usuarios
router.get('/', usuarioController.listar);// Ruta GET /api/usuarios → Lista todos los usuarios
router.get('/:id', usuarioController.obtener);// Ruta GET /api/usuarios/:id → Obtiene un usuario por ID
router.post('/', usuarioController.crear);// Ruta POST /api/usuarios → Crea un nuevo usuario
router.put('/:id', usuarioController.actualizar);// Ruta PUT /api/usuarios/:id → Actualiza un usuario
router.delete('/:id', usuarioController.eliminar);// Ruta DELETE /api/usuarios/:id → Elimina un usuario

module.exports = router;
