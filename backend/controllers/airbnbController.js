const Airbnb = require('../models/Airbnb');

// Obtener todos los alojamientos (público + super admin ve TODO)
exports.getAllAirbnb = async (req, res) => {
  try {
    // 🔥 MODIFICACIÓN: Super admin ve todos, otros solo activos con filtros
    let filters = { activo: true }; // Por defecto solo activos
    
    // Si es super admin, mostrar TODOS los alojamientos (activos e inactivos)
    if (req.user && (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin)) {
      filters = {}; // Sin filtros = mostrar TODO
    } else {
      // Aplicar filtros normales solo para usuarios no super admin
      // Filtro por ciudad
      if (req.query.ciudad) {
        filters['ubicacion.ciudad'] = new RegExp(req.query.ciudad, 'i');
      }
      
      // Filtro por precio
      if (req.query.precioMin) {
        filters.precioPorNoche = { ...filters.precioPorNoche, $gte: req.query.precioMin };
      }
      if (req.query.precioMax) {
        filters.precioPorNoche = { ...filters.precioPorNoche, $lte: req.query.precioMax };
      }
      
      // Filtro por huéspedes
      if (req.query.huespedes) {
        filters['capacidad.huespedes'] = { $gte: req.query.huespedes };
      }
      
      // Filtro por tipo de propiedad
      if (req.query.tipo) {
        filters.tipoPropiedad = req.query.tipo;
      }
    }

    const alojamientos = await Airbnb.find(filters)
      .populate('propietario', 'nombre email createdAt updatedAt') // Más info para super admin
      .sort({ 'calificacion.promedio': -1, updatedAt: -1 }); // Ordenar por última modificación

    res.status(200).json({
      status: 'success',
      results: alojamientos.length,
      data: {
        alojamientos
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener un alojamiento por ID (público)
exports.getAirbnb = async (req, res) => {
  try {
    const alojamiento = await Airbnb.findById(req.params.id)
      .populate('propietario', 'nombre email contacto');

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el alojamiento'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        alojamiento
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Crear nuevo alojamiento (solo administradores)
exports.createAirbnb = async (req, res) => {
  try {
    req.body.propietario = req.user.id;
    const newAlojamiento = await Airbnb.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        alojamiento: newAlojamiento
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener alojamientos del usuario autenticado
exports.getMisAirbnb = async (req, res) => {
  try {
    // 🔥 MODIFICACIÓN: Super admin ve TODOS los alojamientos, no solo los suyos
    let query = { propietario: req.user.id }; // Por defecto solo los del usuario
    
    if (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin) {
      query = {}; // Super admin ve TODOS
    }

    const alojamientos = await Airbnb.find(query)
      .populate('propietario', 'nombre email updatedAt') // Info del propietario para super admin
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: alojamientos.length,
      data: {
        alojamientos
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// ✅ ACTUALIZAR ALOJAMIENTO - CORREGIDO (como hoteles que funciona)
exports.updateAirbnb = async (req, res) => {
  try {
    console.log('🏠 === INICIO ACTUALIZACIÓN AIRBNB ===');
    console.log('🆔 Alojamiento ID:', req.params.id);
    console.log('👤 Usuario:', req.user.email);
    console.log('📝 Campos recibidos:', Object.keys(req.body));

    const alojamiento = await Airbnb.findById(req.params.id);

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el alojamiento'
      });
    }

    // 🔥 MODIFICACIÓN: Super admin puede editar cualquier alojamiento
    const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin && alojamiento.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para actualizar este alojamiento'
      });
    }

    // ✅ PREPARAR DATOS PARA ACTUALIZAR (igual que hoteles)
    const updateData = { ...req.body };
    
    // 🔧 MAPEAR PRECIO A PRECIEPORNOCHE (diferencia con hoteles/cabañas)
    if (updateData.precio) {
        updateData.precioPorNoche = updateData.precio;
        delete updateData.precio; // Eliminar el campo precio original
        console.log(`🔄 Mapeado precio -> precioPorNoche: ${updateData.precioPorNoche}`);
    }
    
    // ✅ PARSEAR OBJETOS JSON (desde FormData) - LISTA COMPLETA
    const fieldsToParseAsJSON = [
        'ubicacion', 
        'contacto', 
        'capacidad', 
        'caracteristicas',
        'servicios', 
        'metodosPago'
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

    // 🔥 AGREGAR: Información de auditoría para el historial
    updateData.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      camposModificados: Object.keys(updateData)
    };

    console.log('📋 Campos finales para actualizar:', Object.keys(updateData));
    console.log('📊 Datos estructurados:', {
        nombre: updateData.nombre ? '✅' : '❌',
        descripcion: updateData.descripcion ? '✅' : '❌',
        precioPorNoche: updateData.precioPorNoche ? '✅' : '❌',
        ubicacion: updateData.ubicacion ? '✅' : '❌',
        contacto: updateData.contacto ? '✅' : '❌',
        capacidad: updateData.capacidad ? '✅' : '❌',
        servicios: updateData.servicios ? `✅ (${updateData.servicios.length})` : '❌',
        metodosPago: updateData.metodosPago ? `✅ (${updateData.metodosPago.length})` : '❌'
    });

    // ✅ ACTUALIZAR EN BASE DE DATOS con datos procesados
    const updatedAlojamiento = await Airbnb.findByIdAndUpdate(
      req.params.id,
      updateData, // ✅ Ahora usa updateData procesado en lugar de req.body
      {
        new: true,
        runValidators: true
      }
    );

    // ✅ RESPUESTA EXITOSA
    res.status(200).json({
      status: 'success',
      message: 'Alojamiento actualizado exitosamente',
      data: {
        alojamiento: updatedAlojamiento
      },
      updateSummary: {
        fieldsUpdated: Object.keys(updateData).filter(key => !key.startsWith('imagen')).length,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ === ALOJAMIENTO ACTUALIZADO EXITOSAMENTE ===');

  } catch (error) {
    console.error('❌ === ERROR EN ACTUALIZACIÓN ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Eliminar alojamiento
exports.deleteAirbnb = async (req, res) => {
  try {
    const alojamiento = await Airbnb.findById(req.params.id);

    if (!alojamiento) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el alojamiento'
      });
    }

    // 🔥 MODIFICACIÓN: Super admin puede eliminar cualquier alojamiento
    const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin && alojamiento.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para eliminar este alojamiento'
      });
    }

    // Soft delete (marcar como inactivo)
    alojamiento.activo = false;
    await alojamiento.save();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};