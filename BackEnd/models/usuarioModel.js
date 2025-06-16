const db = require('./BackEnd/config/db');

//Modelo con funciones CRUD para usuarios
const Usuario = {
  obtenerTodos(callback) {
    const sql = 'SELECT * FROM usuario';  
    db.query(sql, callback);
  },

  obtenerPorId(id, callback) {
    const sql = 'SELECT * FROM usuario WHERE id_usuario = ?';
    db.query(sql, [id], callback);
  },

  crear(data, callback) {
    const sql = `
      INSERT INTO usuario (nombre, apellido, email, contraseña, intereses, antecedentes, imagen_perfil)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
      data.nombre,
      data.apellido,
      data.email,
      data.contraseña,
      data.intereses || null,
      data.antecedentes || null,
      data.imagen_perfil || null
    ];
    db.query(sql, valores, callback);
  },

  actualizar(id, data, callback) {
    const sql = `
      UPDATE usuario SET nombre=?, apellido=?, email=?, contraseña=?, intereses=?, antecedentes=?, imagen_perfil=?
      WHERE id_usuario = ?
    `;
    const valores = [
      data.nombre,
      data.apellido,
      data.email,
      data.contraseña,
      data.intereses,
      data.antecedentes,
      data.imagen_perfil,
      id
    ];
    db.query(sql, valores, callback);
  },

  eliminar(id, callback) {
    const sql = 'DELETE FROM usuario WHERE id_usuario = ?';
    db.query(sql, [id], callback);
  }
};

module.exports = Usuario;
