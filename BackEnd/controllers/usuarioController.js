// ============================
// Controladores de usuarios
// ============================
const Usuario = require('./BackEnd/models/usuarioModel');

// Obtener todos los usuarios
// Este controlador llama al modelo y responde con los usuarios desde la base de datos.
exports.listar = (req, res) => {
  Usuario.obtenerTodos((err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
    res.json(resultados);
  });
};

// Obtener un usuario por ID
exports.obtener = (req, res) => {
  Usuario.obtenerPorId(req.params.id, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al buscar usuario' });
    if (resultados.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(resultados[0]);
  });
};

// Crear nuevo usuario
exports.crear = (req, res) => {
  Usuario.crear(req.body, (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al crear usuario' });
    res.status(201).json({ id_insertado: resultado.insertId });
  });
};

// Actualizar usuario
exports.actualizar = (req, res) => {
  Usuario.actualizar(req.params.id, req.body, (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar usuario' });
    res.json({ mensaje: 'Usuario actualizado' });
  });
};

// Eliminar usuario
exports.eliminar = (req, res) => {
  Usuario.eliminar(req.params.id, (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar usuario' });
    res.json({ mensaje: 'Usuario eliminado' });
  });
};
