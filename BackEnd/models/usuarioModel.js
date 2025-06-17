const pool = require('../config/db');

//Modelo con funciones CRUD para usuarios
const Usuario = {
  obtenerTodos: async () => {
    const [usuarios] = await pool.query('SELECT * FROM usuario');  
    return usuarios;
  },

  obtenerPorId: async (id) => {
    const [usuarios] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [id]);
    return usuarios;
  },

  crear: async (data) => {
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
    const [usuarios] = await pool.query(sql, valores);
    return usuarios;
  },

  actualizar: async (id, data) => {
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
    const [usuarios] = await pool.query(sql, valores);
    return usuarios;
  },

  eliminar: async (id) => {
    const sql = 'DELETE FROM usuario WHERE id_usuario = ?';
    const [usuarios] = await pool.query(sql, [id]);
    return usuarios;
  }
};

module.exports = Usuario;
