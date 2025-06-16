const express = require('express');
const router = express.Router();
const pool = require('./BackEnd/config/db');
const Imagen = require('./BackEnd/models/imagenModel');
const Etiqueta = require('./BackEnd/models/etiquetaModel');
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
  Imagen.obtenerPorAlbum(req.params.albumId, req.session.usuario?.id, async (err, imagenes) => {
    if (err) return res.status(500).send('Error al obtener imágenes');

    const imagenesConDatos = await Promise.all(imagenes.map(async img => {
      return new Promise((resolve) => {
        Etiqueta.obtenerPorImagen(img.id_imagen, (errEt, etiquetas) => {
          if (errEt) etiquetas = [];

          const sqlComentarios = `
            SELECT c.contenido, u.nombre
            FROM comentario c
            JOIN usuario u ON c.usuario_id = u.id_usuario
            WHERE c.imagen_id = ?
          `;
          pool.query(sqlComentarios, [img.id_imagen], (errCom, comentarios) => {
            if (errCom) comentarios = [];
            img.etiquetas = etiquetas;
            img.comentarios = comentarios;
            resolve(img);
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
  const { titulo, etiquetas, album_id, solo_amigos } = req.body;
  const compartidos = req.body.compartidos || [];
  const ruta = '/uploads/' + req.file.filename;

  const datos = {
    titulo,
    ruta,
    album_id,
    solo_amigos: solo_amigos ? 1 : 0
  };

  pool.query('INSERT INTO imagen (titulo, ruta, album_id, solo_amigos) VALUES (?, ?, ?, ?)',
    [datos.titulo, datos.ruta, datos.album_id, datos.solo_amigos],
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
        const sqlCompartir = 'INSERT INTO imagen_usuario_compartida (imagen_id, usuario_id) VALUES ?';
        const valores = compartidos.map(id => [idImagen, id]);

        pool.query(sqlCompartir, [valores], (err) => {
          if (err) console.error('Error al compartir imagen:', err);
          res.redirect(`/albumes/${album_id}`);
        });
      } else {
        res.redirect(`/albumes/${album_id}`);
      }
    });
});

//Comentar imagen
router.post('/comentar/like', (req, res) => {
  const { imagen_id, contenido } = req.body;
  const usuario_id = req.session.usuario?.id;

  if (!usuario_id) return res.status(401).send('Debes iniciar sesión');

  if (contenido) {
    //Si hay contenido, es comentario
    const sql = 'INSERT INTO comentario (contenido, imagen_id, usuario_id) VALUES (?, ?, ?)';
    pool.query(sql, [contenido, imagen_id, usuario_id], (err) => {
      if (err) {
        console.error('Error al comentar:', err);
        return res.status(500).send('Error al guardar comentario');
      }
      return res.redirect('back');
    });
  } else {
    //Si no hay contenido, es like
    const sql = 'INSERT IGNORE INTO me_gusta (imagen_id, usuario_id) VALUES (?, ?)';
    pool.query(sql, [imagen_id, usuario_id], (err) => {
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
    JOIN usuario u ON mg.usuario_id = u.id_usuario
    WHERE mg.imagen_id = ?
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
