// models/usuarioModel.js
const db = require('../config/db');

// Modelo con funciones CRUD para usuarios
const Usuario = {
  obtenerTodos(callback) {
    const sql = 'SELECT * FROM Usuario';
    db.query(sql, callback);
  },

  obtenerPorId(id, callback) {
    const sql = 'SELECT * FROM Usuario WHERE id_usuario = ?';
    db.query(sql, [id], callback);
  },

  crear(data, callback) {
    const sql = `
      INSERT INTO Usuario (nombre, apellido, email, contraseña, intereses, antecedentes, imagen_perfil)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
      data.nombre,
      data.apellido,
      data.email,
      data.contraseña, // recordar que deberá estar hasheada
      data.intereses || null,
      data.antecedentes || null,
      data.imagen_perfil || null
    ];
    db.query(sql, valores, callback);
  },

  actualizar(id, data, callback) {
    const sql = `
      UPDATE Usuario SET nombre=?, apellido=?, email=?, intereses=?, antecedentes=?, imagen_perfil=?
      WHERE id_usuario = ?
    `;
    const valores = [
      data.nombre,
      data.apellido,
      data.email,
      data.intereses,
      data.antecedentes,
      data.imagen_perfil,
      id
    ];
    db.query(sql, valores, callback);
  },

  eliminar(id, callback) {
    const sql = 'DELETE FROM Usuario WHERE id_usuario = ?';
    db.query(sql, [id], callback);
  }
};

module.exports = Usuario;
