const express = require('express');
const cabanaController = require('../controllers/cabanaController');
const authMiddleware = require('../middlewares/authMiddleware');
const Cabana = require('../models/Cabana');

// 🆕 NUEVO: Imports para gestión de imágenes con Cloudinary
const multer = require('multer');
const { cabanaStorage } = require('../config/cloudinary');

const router = express.Router();

// 🆕 NUEVO: Configuración de Multer para Imágenes de Cabañas con Cloudinary
const uploadCabanaImages = multer({
  storage: cabanaStorage,
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
router.get('/', cabanaController.getAllCabanas);

// ===== RUTAS PROTEGIDAS =====
router.use(authMiddleware.protect);

// CORREGIDO: Agregado restrictTo('admin')
router.get('/mis-cabanas', authMiddleware.restrictTo('admin'), cabanaController.getMisCabanas);

router
  .route('/nuevo')
  .post(
    authMiddleware.restrictTo('admin'),
    cabanaController.createCabana
  );

router
  .route('/editar/:id')
  .patch(
    authMiddleware.restrictTo('admin'),
    cabanaController.updateCabana
  )
  .delete(
    authMiddleware.restrictTo('admin'),
    cabanaController.deleteCabana
  );

// 🆕 ===== NUEVAS RUTAS DE GESTIÓN DE IMÁGENES CON CLOUDINARY =====

// 📸 Obtener todas las imágenes de la cabaña
router.get('/:cabanaId/images', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { cabanaId } = req.params;

    const cabana = await Cabana.findOne({ 
      _id: cabanaId,
      propietario: req.user.id,
      activo: true 
    });

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró cabaña asociada o no tienes permisos'
      });
    }

    console.log(`📸 Obteniendo imágenes de cabaña: ${cabana.nombre}`);

    // Con Cloudinary, las URLs ya están validadas por la plataforma
    res.json({
      status: 'success',
      message: 'Imágenes obtenidas exitosamente',
      data: cabana.imagenes || []
    });

  } catch (error) {
    console.error('❌ Error obteniendo imágenes de cabaña:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al obtener imágenes',
      error: error.message
    });
  }
});

// 📤 Subir nuevas imágenes usando Cloudinary
router.post('/:cabanaId/images/upload', authMiddleware.restrictTo('admin'), 
  uploadCabanaImages.array('images'), async (req, res) => {
  try {
    const { cabanaId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se recibieron archivos'
      });
    }

    const cabana = await Cabana.findOne({ 
      _id: cabanaId,
      propietario: req.user.id,
      activo: true 
    });

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró cabaña asociada o no tienes permisos'
      });
    }

    // Obtener URLs de Cloudinary de los archivos subidos
    const imageUrls = files.map(file => file.path);

    // Agregar a la base de datos
    if (!cabana.imagenes) {
      cabana.imagenes = [];
    }
    cabana.imagenes.push(...imageUrls);
    cabana.updatedAt = new Date();
    
    await cabana.save();

    console.log(`✅ ${files.length} imágenes agregadas a cabaña ${cabana.nombre}`);

    res.json({
      status: 'success',
      message: `${files.length} imagen(es) subida(s) exitosamente`,
      data: {
        totalImagenes: cabana.imagenes.length,
        nuevasImagenes: imageUrls
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo imágenes de cabaña:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al subir imágenes',
      error: error.message
    });
  }
});

// 🗑️ Eliminar una imagen específica
router.delete('/:cabanaId/images/:index', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { cabanaId, index } = req.params;
    const imageIndex = parseInt(index);

    const cabana = await Cabana.findOne({ 
      _id: cabanaId,
      propietario: req.user.id,
      activo: true 
    });

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró cabaña asociada o no tienes permisos'
      });
    }

    if (!cabana.imagenes || cabana.imagenes.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No hay imágenes para eliminar'
      });
    }

    if (imageIndex < 0 || imageIndex >= cabana.imagenes.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Índice de imagen inválido'
      });
    }

    const imagenAEliminar = cabana.imagenes[imageIndex];
    
    // 🆕 NUEVO: Eliminar imagen de Cloudinary
    try {
      const cloudinary = require('cloudinary').v2;
      
      // Extraer public_id de la URL de Cloudinary
      const publicId = imagenAEliminar.split('/').pop().split('.')[0];
      const fullPublicId = `turismo-app/cabanas/${publicId}`;
      
      const result = await cloudinary.uploader.destroy(fullPublicId);
      console.log(`🗑️ Imagen eliminada de Cloudinary:`, result);
    } catch (cloudinaryError) {
      console.warn('⚠️ Error eliminando de Cloudinary (continuando):', cloudinaryError.message);
      // Continuamos aunque falle la eliminación en Cloudinary
    }

    // Eliminar de la base de datos
    cabana.imagenes.splice(imageIndex, 1);
    cabana.updatedAt = new Date();
    
    await cabana.save();

    console.log(`✅ Imagen eliminada de cabaña ${cabana.nombre}`);

    res.json({
      status: 'success',
      message: 'Imagen eliminada exitosamente',
      data: {
        totalImagenes: cabana.imagenes.length,
        imagenEliminada: {
          url: imagenAEliminar,
          index: imageIndex
        }
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando imagen de cabaña:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al eliminar imagen',
      error: error.message
    });
  }
});

// ⭐ Establecer imagen como principal
router.patch('/:cabanaId/images/set-main', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { cabanaId } = req.params;
    const { imageIndex } = req.body;
    const index = parseInt(imageIndex);

    const cabana = await Cabana.findOne({ 
      _id: cabanaId,
      propietario: req.user.id,
      activo: true 
    });

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró cabaña asociada o no tienes permisos'
      });
    }

    if (!cabana.imagenes || cabana.imagenes.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No hay imágenes disponibles'
      });
    }

    if (index < 0 || index >= cabana.imagenes.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Índice de imagen inválido'
      });
    }

    if (index === 0) {
      return res.json({
        status: 'success',
        message: 'Esta imagen ya es la principal',
        data: {
          imagenPrincipal: cabana.imagenes[0]
        }
      });
    }

    // Mover la imagen seleccionada al principio del array
    const selectedImage = cabana.imagenes[index];
    cabana.imagenes.splice(index, 1);
    cabana.imagenes.unshift(selectedImage);
    cabana.updatedAt = new Date();
    
    await cabana.save();

    console.log(`⭐ Imagen principal actualizada para cabaña ${cabana.nombre}`);

    res.json({
      status: 'success',
      message: 'Imagen principal actualizada exitosamente',
      data: {
        imagenPrincipal: selectedImage,
        totalImagenes: cabana.imagenes.length
      }
    });

  } catch (error) {
    console.error('❌ Error estableciendo imagen principal de cabaña:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al establecer imagen principal',
      error: error.message
    });
  }
});

// 🔄 OPCIONAL: Ruta de migración para URLs existentes (ejecutar UNA SOLA VEZ)
router.get('/migrate-image-urls', authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    console.log('🔄 Iniciando migración de URLs de imágenes de cabañas...');
    
    // Buscar todas las cabañas que tengan imágenes
    const cabanas = await Cabana.find({ 
      imagenes: { $exists: true, $ne: [] }
    });
    
    let migrated = 0;
    let totalCabanas = cabanas.length;
    
    for (const cabana of cabanas) {
      let needsUpdate = false;
      const updatedImages = cabana.imagenes.map(img => {
        // Si la imagen no empieza con '/' y tampoco es URL completa
        if (!img.startsWith('/') && !img.startsWith('http')) {
          needsUpdate = true;
          return `/${img}`;
        }
        return img;
      });
      
      if (needsUpdate) {
        cabana.imagenes = updatedImages;
        await cabana.save();
        migrated++;
        console.log(`✅ Migrada cabaña: ${cabana.nombre}`);
      }
    }
    
    res.json({
      status: 'success',
      message: 'Migración completada',
      data: {
        totalCabanas,
        migrated,
        noMigration: totalCabanas - migrated
      }
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error en migración',
      error: error.message
    });
  }
});

// REEMPLAZAR LA RUTA EXISTENTE DE TOGGLE-STATUS CON ESTA CORREGIDA:
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

    const cabana = await Cabana.findById(req.params.id);

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'Cabaña no encontrada'
      });
    }

    // Toggle el estado activo
    cabana.activo = !cabana.activo;
    
    // Agregar información de auditoría
    cabana.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: cabana.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };

    await cabana.save();

    res.status(200).json({
      status: 'success',
      message: `Cabaña ${cabana.activo ? 'activada' : 'bloqueada'} exitosamente`,
      data: {
        cabana: {
          id: cabana._id,
          nombre: cabana.nombre,
          activo: cabana.activo
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
router.get('/:id', cabanaController.getCabana);

module.exports = router;

console.log('✅ Rutas de gestión de imágenes de cabañas con Cloudinary configuradas en cabanaRoutes.js');