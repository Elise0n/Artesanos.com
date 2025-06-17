export const verPerfil = async (req, res) => {
    const usuario = req.session.usuario;
  
    const [albumes] = await pool.query(`
      SELECT * FROM album WHERE id_usuario = ? ORDER BY fecha_creacion DESC
    `, [usuario.id_usuario]);
  
    res.render('perfil', { usuario, albumes });
  };
  