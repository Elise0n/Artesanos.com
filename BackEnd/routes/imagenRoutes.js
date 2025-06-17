const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const Imagen = require('../models/imagenModel');
const Etiqueta = require('../models/etiquetaModel');
const multer = require('multer');
const path = require('path');

//Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './FrontEnd/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

//Mostrar imágenes por álbum con etiquetas y comentarios
router.get('/:albumId', (req, res) => {
  if (!req.session.usuario) return res.redirect('/iniciar-sesion');
  Imagen.obtenerPorAlbum(req.params.albumId, req.session.usuario?.id, async (err, imagenes) => {
    if (err) return res.status(500).send('Error al obtener imágenes');

    const imagenesConDatos = await Promise.all(imagenes.map(async img => {
      return new Promise((resolve) => {
        Etiqueta.obtenerPorImagen(img.id_imagen, (errEt, etiquetas) => {
          if (errEt) etiquetas = [];

          const sqlComentarios = `
            SELECT c.contenido, u.nombre
            FROM comentario c
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_imagen = ?
          `;
          pool.query(sqlComentarios, [img.id_imagen], (errCom, comentarios) => {
            if (errCom) comentarios = [];
            img.etiquetas = etiquetas;
            img.comentarios = comentarios;
            // Obtener usuarios con los que fue compartida
            const sqlCompartidos = `
            SELECT u.id_usuario, u.nombre, u.apellido
            FROM imagen_usuario_compartida iuc
            JOIN usuario u ON iuc.id_usuario = u.id_usuario
            WHERE iuc.id_imagen = ?
            `;
            pool.query(sqlCompartidos, [img.id_imagen], (errCompartidos, compartidos) => {
              if (errCompartidos) compartidos = [];
              img.compartidos = compartidos;
              resolve(img);
            });
          });
        });
      });
    }));

    //Simulación de amigos para compartir (solo para frontend)
    const amigos = [
      { id_usuario: 2, nombre: 'Juan', apellido: 'Pérez' },
      { id_usuario: 3, nombre: 'Ana', apellido: 'García' }
    ];

    res.render('imagenes', {
      imagenes: imagenesConDatos,
      albumId: req.params.albumId,
      amigos
    });
  });
});

//Subir imagen con etiquetas y compartir a amigos
router.post('/subir', upload.single('imagen'), async (req, res) => {
  const { titulo, etiquetas, id_album, solo_amigos } = req.body;
  const compartidos = req.body.compartidos || [];
  const ruta_archivo = '/uploads/' + req.file.filename;

  const datos = {
    titulo,
    ruta_archivo,
    id_album,
    solo_amigos: solo_amigos ? 1 : 0
  };

  pool.query('INSERT INTO imagen (titulo, ruta, id_album, solo_amigos) VALUES (?, ?, ?, ?)',
    [datos.titulo, datos.ruta, datos.id_album, datos.solo_amigos],
    async (err, resultado) => {
      if (err) {
        console.error('Error al guardar imagen:', err);
        return res.status(500).send('Error al subir imagen');
      }

      const idImagen = resultado.insertId;

      //Insertar etiquetas si existen
      if (etiquetas) {
        const lista = etiquetas.split(',').map(e => e.trim());
        for (let nombre of lista) {
          await new Promise(resolve => {
            Etiqueta.crearSiNoExiste(nombre, () => {
              Etiqueta.asociarAImagen(idImagen, nombre, () => resolve());
            });
          });
        }
      }

      //Compartir con amigos si corresponde
      if (solo_amigos && Array.isArray(compartidos)) {
        const sqlCompartir = 'INSERT INTO imagen_usuario_compartida (id_imagen, id_usuario) VALUES ?';
        const valores = compartidos.map(id => [idImagen, id]);

        pool.query(sqlCompartir, [valores], (err) => {
          if (err) console.error('Error al compartir imagen:', err);
          res.redirect(`/albumes/${id_album}`);
        });
      } else {
        res.redirect(`/albumes/${id_album}`);
      }
    });
});

//Comentar imagen
router.post('/comentar/like', (req, res) => {
  const { id_imagen, contenido } = req.body;
  const id_usuario = req.session.usuario?.id;

  if (!id_usuario) return res.status(401).send('Debes iniciar sesión');

  if (contenido) {
    //Si hay contenido, es comentario
    const sql = 'INSERT INTO comentario (contenido, id_imagen, id_usuario) VALUES (?, ?, ?)';
    pool.query(sql, [contenido, id_imagen, id_usuario], (err) => {
      if (err) {
        console.error('Error al comentar:', err);
        return res.status(500).send('Error al guardar comentario');
      }
      return res.redirect('back');
    });
  } else {
    //Si no hay contenido, es like
    const sql = 'INSERT IGNORE INTO me_gusta (id_imagen, id_usuario) VALUES (?, ?)';
    pool.query(sql, [id_imagen, id_usuario], (err) => {
      if (err) {
        console.error('Error al dar like:', err);
        return res.status(500).send('Error al dar like');
      }
      return res.redirect('back');
    });
  }
});

//Ver usuarios que dieron like a una imagen
router.get('/:imagenId/likes', (req, res) => {
  const sql = `
    SELECT u.id_usuario, u.nombre, u.apellido
    FROM me_gusta mg
    JOIN usuario u ON mg.id_usuario = u.id_usuario
    WHERE mg.id_imagen = ?
  `;
  pool.query(sql, [req.params.imagenId], (err, resultados) => {
    if (err) {
      console.error('Error al obtener likes:', err);
      return res.status(500).send('Error al obtener likes');
    }
    res.render('likes', { usuarios: resultados });
  });
});


module.exports = router;
