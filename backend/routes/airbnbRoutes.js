const express = require('express');
const airbnbController = require('../controllers/airbnbController');
const authMiddleware = require('../middlewares/authMiddleware');
const Airbnb = require('../models/Airbnb');

// 🆕 NUEVO: Imports para gestión de imágenes
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 🆕 NUEVO: Configuración de Multer para Imágenes de Airbnb
const airbnbUploadsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads', 'airbnb');
if (!fs.existsSync(airbnbUploadsDir)) {
  fs.mkdirSync(airbnbUploadsDir, { recursive: true });
  console.log('📁 Carpeta de uploads de Airbnb creada');
}

const airbnbImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, airbnbUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `airbnb-${uniqueSuffix}-${name}${ext}`);
  }
});

const uploadAirbnbImages = multer({
  storage: airbnbImageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

// ===== RUTAS PÚBLICAS =====
router.get('/', airbnbController.getAllAirbnb);

// Todas las rutas siguientes requieren autenticación
router.use(authMiddleware.protect);

// ===== RUTAS PARA ADMINISTRADORES =====
router
  .route('/mis-alojamientos')
  .get(authMiddleware.restrictTo('admin'), airbnbController.getMisAirbnb);

router
  .route('/nuevo')
  .post(
    authMiddleware.restrictTo('admin'),
    airbnbController.createAirbnb
  );

// 🆕 ===== NUEVAS RUTAS DE GESTIÓN DE IMÁGENES =====

// 📸 Obtener todas las imágenes del alojamiento
router.get('/:alojamientoId/images', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { alojamientoId } = req.params;

    const alojamiento = await Airbnb.findOne({ 
      _id: alojamientoId,
      propietario: req.user.id,
      activo: true 
    });

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró alojamiento asociado o no tienes permisos'
      });
    }

    // ✅ CAMBIO 1: Estructura de respuesta corregida para que coincida con el frontend
    res.json({
      status: 'success',
      data: alojamiento.imagenes || [], // Las imágenes directamente en data
      alojamiento: {
        id: alojamiento._id,
        nombre: alojamiento.nombre,
        totalImagenes: alojamiento.imagenes ? alojamiento.imagenes.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo imágenes del alojamiento:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor'
    });
  }
});

// 📤 Subir múltiples imágenes al alojamiento
router.post('/:alojamientoId/upload-images', 
  authMiddleware.restrictTo('admin'),
  uploadAirbnbImages.array('images', 10),
  async (req, res) => {
  try {
    const { alojamientoId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se enviaron archivos de imagen'
      });
    }

    console.log(`📸 Procesando ${req.files.length} imágenes para alojamiento ${alojamientoId}`);

    const alojamiento = await Airbnb.findOne({ 
      _id: alojamientoId,
      propietario: req.user.id,
      activo: true 
    });

    if (!alojamiento) {
      // Limpiar archivos si no hay alojamiento
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error eliminando archivo:', err);
        });
      });
      
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró alojamiento asociado o no tienes permisos'
      });
    }

    // Crear URLs de las nuevas imágenes
    const nuevasImagenesUrls = req.files.map(file => {
      return `/uploads/airbnb/${file.filename}`;
    });

    // Agregar imágenes al alojamiento
    if (!alojamiento.imagenes) {
      alojamiento.imagenes = [];
    }
    
    alojamiento.imagenes.push(...nuevasImagenesUrls);
    alojamiento.updatedAt = new Date();
    
    await alojamiento.save();

    console.log(`✅ ${nuevasImagenesUrls.length} imágenes subidas para alojamiento ${alojamiento.nombre}`);

    res.json({
      status: 'success',
      message: `${nuevasImagenesUrls.length} imagen(es) subida(s) exitosamente`,
      data: {
        imagenesAgregadas: nuevasImagenesUrls.length,
        totalImagenes: alojamiento.imagenes.length,
        nuevasImagenes: nuevasImagenesUrls
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo imágenes del alojamiento:', error);
    
    // Limpiar archivos en caso de error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error eliminando archivo:', err);
        });
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al subir imágenes',
      error: error.message
    });
  }
});

// 🗑️ Eliminar imagen específica del alojamiento
router.delete('/:alojamientoId/images/:imageIndex', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { alojamientoId, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const alojamiento = await Airbnb.findOne({ 
      _id: alojamientoId,
      propietario: req.user.id,
      activo: true 
    });

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado o sin permisos'
      });
    }

    if (!alojamiento.imagenes || !alojamiento.imagenes[index]) {
      return res.status(404).json({
        status: 'error',
        message: 'Imagen no encontrada'
      });
    }

    const imagenAEliminar = alojamiento.imagenes[index];
    
    // Eliminar archivo físico
    const nombreArchivo = imagenAEliminar.split('/').pop();
    const rutaCompleta = path.join(airbnbUploadsDir, nombreArchivo);
    
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
      console.log(`✅ Archivo eliminado: ${rutaCompleta}`);
    }

    // Eliminar de la base de datos
    alojamiento.imagenes.splice(index, 1);
    alojamiento.updatedAt = new Date();
    await alojamiento.save();

    res.json({
      status: 'success',
      message: 'Imagen eliminada exitosamente',
      data: {
        imagenesRestantes: alojamiento.imagenes.length,
        imagenEliminada: imagenAEliminar
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al eliminar imagen'
    });
  }
});

// ✅ CAMBIO 2: Ruta corregida para establecer imagen principal
// 🎯 Establecer imagen principal (mover a primera posición)
router.patch('/:alojamientoId/images/set-main', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { alojamientoId } = req.params;
    const { imageIndex } = req.body; // ✅ Ahora toma imageIndex del body
    const index = parseInt(imageIndex);

    const alojamiento = await Airbnb.findOne({ 
      _id: alojamientoId,
      propietario: req.user.id,
      activo: true 
    });

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado o sin permisos'
      });
    }

    if (!alojamiento.imagenes || !alojamiento.imagenes[index]) {
      return res.status(404).json({
        status: 'error',
        message: 'Imagen no encontrada'
      });
    }

    // Mover imagen a primera posición
    const imagenPrincipal = alojamiento.imagenes.splice(index, 1)[0];
    alojamiento.imagenes.unshift(imagenPrincipal);
    
    alojamiento.updatedAt = new Date();
    await alojamiento.save();

    res.json({
      status: 'success',
      message: 'Imagen principal establecida exitosamente',
      data: {
        nuevaImagenPrincipal: imagenPrincipal,
        totalImagenes: alojamiento.imagenes.length
      }
    });

  } catch (error) {
    console.error('❌ Error estableciendo imagen principal:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor'
    });
  }
});

// 🖼️ Obtener imagen principal del alojamiento
router.get('/:alojamientoId/main-image', async (req, res) => {
  try {
    const { alojamientoId } = req.params;

    const alojamiento = await Airbnb.findOne({ 
      _id: alojamientoId,
      activo: true 
    });

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado'
      });
    }

    const mainImage = alojamiento.imagenes && alojamiento.imagenes.length > 0 
      ? alojamiento.imagenes[0] 
      : null;

    res.json({
      status: 'success',
      data: {
        mainImage: mainImage,
        totalImages: alojamiento.imagenes ? alojamiento.imagenes.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo imagen principal del alojamiento:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor'
    });
  }
});

// ===== RUTAS EXISTENTES =====

// ✅ RUTA PRINCIPAL PARA EDITAR - /editar/:id (SIN MULTER)
router
  .route('/editar/:id')
  .patch(
    authMiddleware.restrictTo('admin'),
    airbnbController.updateAirbnb
  )
  .delete(
    authMiddleware.restrictTo('admin'),
    airbnbController.deleteAirbnb
  );

// ✅ RUTA DE TOGGLE STATUS
router.patch('/:id/toggle-status', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    // Verificar si es super admin
    const isSuperAdmin = req.user.email === 'superadmin@turismo.com' || 
                          req.user.email === 'direcciondeturismojalpan@gmail.com' || 
                          req.user.isSuperAdmin || 
                          req.user.role === 'super-admin';

    if (!isSuperAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para realizar esta acción. Se requieren privilegios de super administrador.'
      });
    }

    const alojamiento = await Airbnb.findById(req.params.id);

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado'
      });
    }

    // Toggle el estado activo
    alojamiento.activo = !alojamiento.activo;
    
    // Agregar información de auditoría
    alojamiento.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: alojamiento.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };

    await alojamiento.save();

    res.status(200).json({
      status: 'success',
      message: `Alojamiento ${alojamiento.activo ? 'activado' : 'bloqueado'} exitosamente`,
      data: {
        alojamiento: {
          id: alojamiento._id,
          nombre: alojamiento.nombre,
          activo: alojamiento.activo
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// 🛠️ Middleware de manejo de errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'Archivo muy grande. Máximo 5MB por imagen.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Demasiados archivos. Máximo 10 imágenes por vez.'
      });
    }
  }
  
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({
      status: 'error',
      message: 'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'
    });
  }
  
  next(error);
});

// IMPORTANTE: Esta ruta debe ir AL FINAL
router.get('/:id', airbnbController.getAirbnb);

module.exports = router;

console.log('✅ Rutas de gestión de imágenes de Airbnb configuradas en airbnbRoutes.js');