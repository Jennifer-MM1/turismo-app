const Cabana = require('../models/Cabana');

// Obtener todas las cabañas (público + super admin ve TODO)
exports.getAllCabanas = async (req, res) => {
  try {
    //  Super admin ve todas, otros solo activas
    let query = { activo: true }; // Por defecto solo activas
    
    // Si es super admin, mostrar TODAS las cabañas (activas e inactivas)
    if (req.user && (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin)) {
      query = {}; // Sin filtros = mostrar TODO
    }
    const cabanas = await Cabana.find(query)
      .populate('propietario', 'nombre email createdAt updatedAt') // Más info para super admin
      .sort({ updatedAt: -1 }); // Ordenar por última modificación

    res.status(200).json({
      status: 'success',
      results: cabanas.length,
      data: {
        cabanas
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
// Obtener una cabaña por ID (público)
exports.getCabana = async (req, res) => {
  try {
    const cabana = await Cabana.findById(req.params.id)
      .populate('propietario', 'nombre email contacto');

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró la cabaña'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cabana
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Crear nueva cabaña (solo administradores)
exports.createCabana = async (req, res) => {
  try {
    req.body.propietario = req.user.id;
    const newCabana = await Cabana.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        cabana: newCabana
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener cabañas del usuario autenticado
exports.getMisCabanas = async (req, res) => {
  try {
    // 🔥 MODIFICACIÓN: Super admin ve TODAS las cabañas, no solo las suyas
    let query = { propietario: req.user.id }; // Por defecto solo las del usuario
    
    if (req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin) {
      query = {}; // Super admin ve TODAS
    }

    const cabanas = await Cabana.find(query)
      .populate('propietario', 'nombre email updatedAt') // Info del propietario para super admin
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: cabanas.length,
      data: {
        cabanas
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Actualizar cabaña
exports.updateCabana = async (req, res) => {
  try {
    const cabana = await Cabana.findById(req.params.id);

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró la cabaña'
      });
    }

    // 🔥 MODIFICACIÓN: Super admin puede editar cualquier cabaña
    const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin && cabana.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para actualizar esta cabaña'
      });
    }

    // 🔥 AGREGAR: Información de auditoría para el historial
    req.body.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      camposModificados: Object.keys(req.body)
    };

    const updatedCabana = await Cabana.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        cabana: updatedCabana
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Eliminar cabaña
exports.deleteCabana = async (req, res) => {
  try {
    const cabana = await Cabana.findById(req.params.id);

    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró la cabaña'
      });
    }

    // 🔥 MODIFICACIÓN: Super admin puede eliminar cualquier cabaña
    const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin && cabana.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para eliminar esta cabaña'
      });
    }

    // Soft delete (marcar como inactiva)
    cabana.activo = false;
    await cabana.save();

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