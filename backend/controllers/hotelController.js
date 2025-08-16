const Hotel = require('../models/Hotel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===== CONFIGURACIÓN DE MULTER PARA HOTELES =====
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'frontend/public/uploads/hoteles/';
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'hotel-' + uniqueSuffix + extension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB por archivo
        files: 10 // máximo 10 archivos
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (allowedTypes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
    }
});

// ===== FUNCIONES AUXILIARES PARA MANEJO DE IMÁGENES =====
function deleteImageFile(imagePath) {
    try {
        // Construir ruta completa del archivo
        const fullPath = path.join(__dirname, '../frontend/public', imagePath);
        
        // Verificar si el archivo existe y eliminarlo
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Imagen eliminada: ${imagePath}`);
            return true;
        } else {
            console.log(`⚠️ Archivo no encontrado: ${imagePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error al eliminar imagen ${imagePath}:`, error.message);
        return false;
    }
}

// ✅ FUNCIÓN MEJORADA: processImageData con soporte para múltiples formatos
function processImageData(req, currentImages = []) {
    console.log('🔄 === PROCESANDO IMÁGENES ===');
    console.log('📸 Imágenes actuales:', currentImages.length);
    console.log('📎 Archivos nuevos recibidos:', req.files?.length || 0);
    console.log('📋 Body keys:', Object.keys(req.body));
    
    let imagenesActualizadas = [...currentImages];
    const imagenesEliminadas = [];
    
    // ✅ MÉTODO 1: Procesar imágenes a eliminar (formato JSON - nuevo)
    if (req.body.imagenesEliminar) {
        try {
            const imagenesAEliminar = JSON.parse(req.body.imagenesEliminar);
            console.log('🗑️ Imágenes a eliminar (JSON):', imagenesAEliminar);
            
            imagenesAEliminar.forEach(imagenUrl => {
                const index = imagenesActualizadas.indexOf(imagenUrl);
                if (index > -1) {
                    imagenesActualizadas.splice(index, 1);
                    imagenesEliminadas.push(imagenUrl);
                    
                    // Eliminar archivo físico del servidor
                    if (!imagenUrl.startsWith('http')) {
                        deleteImageFile(imagenUrl);
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error procesando imagenesEliminar JSON:', error.message);
        }
    }
    
    // ✅ MÉTODO 2: Procesar imágenes a eliminar (formato contador - anterior)
    const imagenesEliminarCount = parseInt(req.body.imagenesEliminarCount) || 0;
    if (imagenesEliminarCount > 0) {
        console.log('🗑️ Procesando imágenes a eliminar (contador):', imagenesEliminarCount);
        
        for (let i = 0; i < imagenesEliminarCount; i++) {
            const imagenAEliminar = req.body[`imagenEliminar${i}`];
            if (imagenAEliminar && !imagenesEliminadas.includes(imagenAEliminar)) {
                // Remover del array
                const index = imagenesActualizadas.indexOf(imagenAEliminar);
                if (index > -1) {
                    imagenesActualizadas.splice(index, 1);
                    imagenesEliminadas.push(imagenAEliminar);
                    
                    // Eliminar archivo físico del servidor
                    if (!imagenAEliminar.startsWith('http')) {
                        deleteImageFile(imagenAEliminar);
                    }
                }
            }
        }
    }
    
    // ✅ AGREGAR NUEVAS IMÁGENES SUBIDAS
    const nuevasImagenes = [];
    if (req.files && req.files.length > 0) {
        console.log('📎 Procesando nuevas imágenes:', req.files.length);
        req.files.forEach((file, index) => {
            const imagePath = `/uploads/hoteles/${file.filename}`;
            nuevasImagenes.push(imagePath);
            imagenesActualizadas.push(imagePath);
            console.log(`📎 Nueva imagen ${index + 1}: ${imagePath} (${file.size} bytes)`);
        });
    }
    
    console.log(`📸 === RESUMEN DE PROCESAMIENTO ===`);
    console.log(`   - Imágenes eliminadas: ${imagenesEliminadas.length}`);
    console.log(`   - Nuevas imágenes: ${nuevasImagenes.length}`);
    console.log(`   - Total final: ${imagenesActualizadas.length}`);
    console.log(`=======================================`);
    
    return {
        imagenesActualizadas,
        imagenesEliminadas,
        nuevasImagenes
    };
}

// ===== CONTROLADORES =====

// Obtener todos los hoteles (público + super admin ve TODO)
exports.getAllHoteles = async (req, res) => {
  try {
    // Super admin ve todos, otros solo activos
    let query = { activo: true }; // Por defecto solo activos
    
    // Si es super admin, mostrar TODOS los hoteles (activos e inactivos)
    if (req.user && (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin)) {
      query = {}; // Sin filtros = mostrar TODO
    }
    
    const hoteles = await Hotel.find(query)
      .populate('propietario', 'nombre email createdAt updatedAt') // Más info para super admin
      .sort({ updatedAt: -1 }); // Ordenar por última modificación

    res.status(200).json({
      status: 'success',
      results: hoteles.length,
      data: {
        hoteles
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener un hotel por ID (público)
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('propietario', 'nombre email contacto');

    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el hotel'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        hotel
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error', 
      message: error.message
    });
  }
};

// Crear nuevo hotel (solo administradores)
exports.createHotel = async (req, res) => {
  try {
    // Agregar el propietario (usuario autenticado)
    req.body.propietario = req.user.id;

    const newHotel = await Hotel.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        hotel: newHotel
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener hoteles del usuario autenticado
exports.getMisHoteles = async (req, res) => {
  try {
    // Super admin ve TODOS los hoteles, no solo los suyos
    let query = { propietario: req.user.id }; // Por defecto solo los del usuario
    
    if (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin) {
      query = {}; // Super admin ve TODOS
    }

    const hoteles = await Hotel.find(query)
      .populate('propietario', 'nombre email updatedAt') // Info del propietario para super admin
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: hoteles.length,
      data: {
        hoteles
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// ===== ACTUALIZAR HOTEL CON GESTIÓN DE IMÁGENES MEJORADA =====
exports.updateHotel = [
    // Middleware de multer para múltiples archivos
    upload.array('imagenNueva', 10),
    
    async (req, res) => {
        try {
            console.log('🏨 === INICIO ACTUALIZACIÓN HOTEL ===');
            console.log('🆔 Hotel ID:', req.params.id);
            console.log('👤 Usuario:', req.user.email);
            console.log('📝 Campos recibidos:', Object.keys(req.body));
            console.log('📸 Archivos recibidos:', req.files?.length || 0);
            
            // ✅ VERIFICAR QUE EL HOTEL EXISTE
            const hotel = await Hotel.findById(req.params.id);
            if (!hotel) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No se encontró el hotel'
                });
            }
            
            // ✅ VERIFICAR PERMISOS
            const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
            if (!isSuperAdmin && hotel.propietario.toString() !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'No tienes permiso para actualizar este hotel'
                });
            }

            // ✅ PROCESAR IMÁGENES
            const imageResult = processImageData(req, hotel.imagenes || []);
            
            // ✅ PREPARAR DATOS PARA ACTUALIZAR
            const updateData = { ...req.body };
            
            // ✅ PARSEAR OBJETOS JSON (desde FormData) - LISTA COMPLETA
            const fieldsToParseAsJSON = [
                'ubicacion', 
                'contacto', 
                'capacidad', 
                'servicios', 
                'metodosPago',           // ✅ AGREGADO
                'practicasEcologicas'    // ✅ AGREGADO
            ];
            
            fieldsToParseAsJSON.forEach(field => {
                if (updateData[field] && typeof updateData[field] === 'string') {
                    try {
                        updateData[field] = JSON.parse(updateData[field]);
                        console.log(`✅ Parseado ${field}:`, updateData[field]);
                    } catch (e) {
                        console.log(`⚠️ No se pudo parsear ${field}:`, e.message);
                    }
                }
            });
            
            // ✅ ACTUALIZAR IMÁGENES
            updateData.imagenes = imageResult.imagenesActualizadas;
            
            // ✅ AGREGAR INFORMACIÓN DE AUDITORÍA
            updateData.ultimaModificacion = {
                usuario: req.user.id,
                fecha: new Date(),
                camposModificados: Object.keys(updateData).filter(key => !key.startsWith('imagen'))
            };

            // ✅ LIMPIAR CAMPOS TEMPORALES Y DE METADATA
            const fieldsToRemove = [
                // Campos de metadata de imágenes
                'imagenesActualesCount', 
                'imagenesNuevasCount', 
                'imagenesEliminarCount',
                'imagenesEliminar',
                'imagenesActuales'
            ];
            fieldsToRemove.forEach(field => delete updateData[field]);
            
            // ✅ LIMPIAR CAMPOS DE IMÁGENES INDIVIDUALES
            Object.keys(updateData).forEach(key => {
                if (key.startsWith('imagenActual') || 
                    key.startsWith('imagenNueva') || 
                    key.startsWith('imagenEliminar')) {
                    delete updateData[key];
                }
            });

            console.log('📋 Campos finales para actualizar:', Object.keys(updateData));
            console.log('📊 Datos estructurados:', {
                nombre: updateData.nombre ? '✅' : '❌',
                descripcion: updateData.descripcion ? '✅' : '❌',
                precio: updateData.precio ? '✅' : '❌',
                ubicacion: updateData.ubicacion ? '✅' : '❌',
                contacto: updateData.contacto ? '✅' : '❌',
                capacidad: updateData.capacidad ? '✅' : '❌',
                servicios: updateData.servicios ? `✅ (${updateData.servicios.length})` : '❌',
                metodosPago: updateData.metodosPago ? `✅ (${updateData.metodosPago.length})` : '❌',
                imagenes: `✅ (${updateData.imagenes.length})`
            });

            // ✅ ACTUALIZAR EN BASE DE DATOS
            const updatedHotel = await Hotel.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

            // ✅ RESPUESTA EXITOSA
            res.status(200).json({
                status: 'success',
                message: 'Hotel actualizado exitosamente',
                data: {
                    hotel: updatedHotel
                },
                imageDetails: {
                    totalImages: imageResult.imagenesActualizadas.length,
                    newImages: imageResult.nuevasImagenes.length,
                    deletedImages: imageResult.imagenesEliminadas.length
                },
                updateSummary: {
                    fieldsUpdated: Object.keys(updateData).filter(key => !key.startsWith('imagen')).length,
                    timestamp: new Date().toISOString()
                }
            });

            console.log('✅ === HOTEL ACTUALIZADO EXITOSAMENTE ===');

        } catch (error) {
            console.error('❌ === ERROR EN ACTUALIZACIÓN ===');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            
            // ✅ LIMPIAR ARCHIVOS SUBIDOS EN CASO DE ERROR
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    const filePath = path.join(__dirname, '../frontend/public/uploads/hoteles/', file.filename);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`🗑️ Archivo limpiado tras error: ${file.filename}`);
                        } catch (cleanupError) {
                            console.error(`❌ Error limpiando archivo ${file.filename}:`, cleanupError.message);
                        }
                    }
                });
            }
            
            // ✅ MANEJO DE ERRORES ESPECÍFICOS
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Uno o más archivos superan el tamaño máximo de 5MB',
                    code: 'FILE_TOO_LARGE'
                });
            }
            
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Demasiados archivos. Máximo 10 imágenes permitidas',
                    code: 'TOO_MANY_FILES'
                });
            }
            
            if (error.message && error.message.includes('Tipo de archivo no permitido')) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Formato de archivo no permitido. Use JPG, PNG o WEBP',
                    code: 'INVALID_FILE_TYPE'
                });
            }

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(e => e.message);
                return res.status(400).json({
                    status: 'error',
                    message: 'Error de validación: ' + errors.join(', '),
                    code: 'VALIDATION_ERROR',
                    errors: errors
                });
            }

            if (error.name === 'CastError') {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de hotel inválido',
                    code: 'INVALID_ID'
                });
            }

            // Error genérico
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor al actualizar el hotel',
                code: 'INTERNAL_ERROR'
            });
        }
    }
];

// Eliminar hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el hotel'
      });
    }

    // Super admin puede eliminar cualquier hotel
    const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin && hotel.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para eliminar este hotel'
      });
    }

    // Soft delete (marcar como inactivo)
    hotel.activo = false;
    hotel.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: 'eliminado'
    };
    await hotel.save();

    res.status(200).json({
      status: 'success',
      message: 'Hotel eliminado exitosamente',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};