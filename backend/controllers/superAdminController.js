// controllers/superAdminController.js
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Cabana = require('../models/Cabana');
const Airbnb = require('../models/Airbnb');
const GuiaTuristica = require('../models/GuiaTuristica');
const TourOperadora = require('../models/TourOperadora');

// Función para generar contraseña temporal
const generarContrasenatemporal = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let resultado = '';
  for (let i = 0; i < 8; i++) {
    resultado += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return resultado;
};

// Función para determinar tipoNegocio según el tipo
const getTipoNegocio = (tipo) => {
  const mapping = {
    'hotel': 'hotel',
    'cabana': 'cabana', 
    'airbnb': 'ayb',
    'guiaturistica': 'guiaturistica',
    'touroperadora': 'touroperadora'
  };
  return mapping[tipo] || 'hotel';
};

// 🏨 CREAR HOTEL + USUARIO
exports.crearHotelConUsuario = async (req, res) => {
  try {
    const { propietario_nombre, contacto, ...hotelData } = req.body;
    
    // 1. Verificar si ya existe un usuario con ese email
    const usuarioExistente = await User.findOne({ email: contacto.email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario registrado con este email'
      });
    }
    
    // 2. Generar contraseña temporal
    const contraseñaTemporal = generarContrasenatemporal();
    
    // 3. Crear usuario
    const nuevoUsuario = await User.create({
      nombre: propietario_nombre,
      email: contacto.email,
      password: contraseñaTemporal,
      role: 'admin',
      tipoNegocio: 'hotel',
      activo: true
    });
    
    // 4. Crear hotel asociado al nuevo usuario
    // 🔥 CORRECCIÓN: Agregar activo: true explícitamente
    const nuevoHotel = await Hotel.create({
      ...hotelData,
      contacto,
      propietario: nuevoUsuario._id,
      activo: true  // ← LÍNEA AGREGADA
    });
    
    // 5. Respuesta exitosa
    res.status(201).json({
      status: 'success',
      message: 'Hotel y usuario creados exitosamente',
      data: {
        establecimiento: {
          id: nuevoHotel._id,
          nombre: nuevoHotel.nombre,
          tipo: 'hotel'
        },
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          contraseñaTemporal: contraseñaTemporal // Solo se envía una vez
        }
      }
    });
    
  } catch (error) {
    console.error('Error creando hotel con usuario:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🏔️ CREAR CABAÑA + USUARIO
exports.crearCabanaConUsuario = async (req, res) => {
  try {
    const { propietario_nombre, contacto, ...cabanaData } = req.body;
    
    const usuarioExistente = await User.findOne({ email: contacto.email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario registrado con este email'
      });
    }
    
    const contraseñaTemporal = generarContrasenatemporal();
    
    const nuevoUsuario = await User.create({
      nombre: propietario_nombre,
      email: contacto.email,
      password: contraseñaTemporal,
      role: 'admin',
      tipoNegocio: 'cabana',
      activo: true
    });
    
    // 🔥 CORRECCIÓN: Agregar activo: true explícitamente
    const nuevaCabana = await Cabana.create({
      ...cabanaData,
      contacto,
      propietario: nuevoUsuario._id,
      activo: true  // ← LÍNEA AGREGADA
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Cabaña y usuario creados exitosamente',
      data: {
        establecimiento: {
          id: nuevaCabana._id,
          nombre: nuevaCabana.nombre,
          tipo: 'cabana'
        },
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          contraseñaTemporal: contraseñaTemporal
        }
      }
    });
    
  } catch (error) {
    console.error('Error creando cabaña con usuario:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🏠 CREAR AIRBNB + USUARIO
exports.crearAirbnbConUsuario = async (req, res) => {
  try {
    const { propietario_nombre, contacto, ...airbnbData } = req.body;
    
    const usuarioExistente = await User.findOne({ email: contacto.email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario registrado con este email'
      });
    }
    
    const contraseñaTemporal = generarContrasenatemporal();
    
    const nuevoUsuario = await User.create({
      nombre: propietario_nombre,
      email: contacto.email,
      password: contraseñaTemporal,
      role: 'admin',
      tipoNegocio: 'ayb',
      activo: true
    });
    
    // 🔥 CORRECCIÓN: Agregar activo: true explícitamente
    const nuevoAirbnb = await Airbnb.create({
      ...airbnbData,
      contacto,
      propietario: nuevoUsuario._id,
      activo: true  // ← LÍNEA AGREGADA
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Alojamiento y usuario creados exitosamente',
      data: {
        establecimiento: {
          id: nuevoAirbnb._id,
          nombre: nuevoAirbnb.nombre,
          tipo: 'airbnb'
        },
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          contraseñaTemporal: contraseñaTemporal
        }
      }
    });
    
  } catch (error) {
    console.error('Error creando Airbnb con usuario:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 👨‍💼 CREAR GUÍA + USUARIO (🔥 ACTUALIZADO - FORMULARIO SIMPLIFICADO)
exports.crearGuiaConUsuario = async (req, res) => {
  try {
    const { contacto, ...guiaData } = req.body;
    
    // Verificar si ya existe un usuario con este email
    const usuarioExistente = await User.findOne({ email: contacto.email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario registrado con este email'
      });
    }
    
    const contraseñaTemporal = generarContrasenatemporal();
    
    // Para guías, el nombre del usuario es nombre + apellidos
    const nombreCompleto = `${guiaData.nombre} ${guiaData.apellidos}`;
    
    const nuevoUsuario = await User.create({
      nombre: nombreCompleto,
      email: contacto.email,
      password: contraseñaTemporal,
      role: 'admin',
      tipoNegocio: 'guiaturistica',
      activo: true
    });
    
    // 🔥 CORRECCIÓN: Agregar activo: true explícitamente
    // Crear la guía con campos simplificados
    const nuevaGuia = await GuiaTuristica.create({
      nombre: guiaData.nombre,
      apellidos: guiaData.apellidos,
      contacto: contacto,
      especialidades: guiaData.especialidades,
      descripcion: 'Guía turística especializada en las tradiciones y naturaleza de la Sierra Gorda', // Descripción por defecto
      propietario: nuevoUsuario._id,
      activo: true  // ← LÍNEA AGREGADA
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Guía turística y usuario creados exitosamente',
      data: {
        establecimiento: {
          id: nuevaGuia._id,
          nombre: `${nuevaGuia.nombre} ${nuevaGuia.apellidos}`,
          tipo: 'guia'
        },
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          contraseñaTemporal: contraseñaTemporal
        }
      }
    });
    
  } catch (error) {
    console.error('Error creando guía con usuario:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🚌 CREAR TOUR OPERADORA + USUARIO
exports.crearTourConUsuario = async (req, res) => {
  try {
    const { propietario_nombre, contacto, ...tourData } = req.body;
    
    const usuarioExistente = await User.findOne({ email: contacto.email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario registrado con este email'
      });
    }
    
    const contraseñaTemporal = generarContrasenatemporal();
    
    const nuevoUsuario = await User.create({
      nombre: propietario_nombre,
      email: contacto.email,
      password: contraseñaTemporal,
      role: 'admin',
      tipoNegocio: 'touroperadora',
      activo: true
    });
    
    // 🔥 CORRECCIÓN: Agregar activo: true explícitamente
    const nuevaTour = await TourOperadora.create({
      ...tourData,
      contacto,
      propietario: nuevoUsuario._id,
      activo: true  // ← LÍNEA AGREGADA
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Tour operadora y usuario creados exitosamente',
      data: {
        establecimiento: {
          id: nuevaTour._id,
          nombre: nuevaTour.nombre,
          tipo: 'tour'
        },
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          contraseñaTemporal: contraseñaTemporal
        }
      }
    });
    
  } catch (error) {
    console.error('Error creando tour operadora con usuario:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🔄 TRANSFERIR PROPIEDAD DE ESTABLECIMIENTO
exports.transferirPropiedad = async (req, res) => {
  try {
    const { establecimientoId, tipoEstablecimiento, nuevoEmailPropietario } = req.body;
    
    // Verificar que es super admin
    if (!req.user.isSuperAdministrator()) {
      return res.status(403).json({
        status: 'error',
        message: 'Solo super administradores pueden transferir propiedades'
      });
    }
    
    // Buscar el nuevo propietario
    const nuevoPropietario = await User.findOne({ email: nuevoEmailPropietario });
    if (!nuevoPropietario) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró un usuario con ese email'
      });
    }
    
    // Buscar y actualizar el establecimiento según su tipo
    let establecimiento;
    switch(tipoEstablecimiento) {
      case 'hotel':
        establecimiento = await Hotel.findByIdAndUpdate(
          establecimientoId,
          { propietario: nuevoPropietario._id },
          { new: true }
        );
        break;
      case 'cabana':
        establecimiento = await Cabana.findByIdAndUpdate(
          establecimientoId,
          { propietario: nuevoPropietario._id },
          { new: true }
        );
        break;
      case 'airbnb':
        establecimiento = await Airbnb.findByIdAndUpdate(
          establecimientoId,
          { propietario: nuevoPropietario._id },
          { new: true }
        );
        break;
      case 'guia':
        establecimiento = await GuiaTuristica.findByIdAndUpdate(
          establecimientoId,
          { propietario: nuevoPropietario._id },
          { new: true }
        );
        break;
      case 'tour':
        establecimiento = await TourOperadora.findByIdAndUpdate(
          establecimientoId,
          { propietario: nuevoPropietario._id },
          { new: true }
        );
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Tipo de establecimiento no válido'
        });
    }
    
    if (!establecimiento) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró el establecimiento'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Propiedad transferida exitosamente',
      data: {
        establecimiento: {
          id: establecimiento._id,
          nombre: establecimiento.nombre
        },
        nuevoPropietario: {
          id: nuevoPropietario._id,
          nombre: nuevoPropietario.nombre,
          email: nuevoPropietario.email
        }
      }
    });
    
  } catch (error) {
    console.error('Error transfiriendo propiedad:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==================== FUNCIONES TOGGLE STATUS (BLOQUEAR/ACTIVAR) ====================

// 🔄 TOGGLE STATUS HOTEL
exports.toggleStatusHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel no encontrado'
      });
    }
    
    // Toggle el estado activo
    hotel.activo = !hotel.activo;
    
    // Agregar información de auditoría
    hotel.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: hotel.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };
    
    await hotel.save();
    
    res.status(200).json({
      status: 'success',
      message: `Hotel ${hotel.activo ? 'activado' : 'bloqueado'} exitosamente`,
      data: {
        hotel: {
          id: hotel._id,
          nombre: hotel.nombre,
          activo: hotel.activo
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🔄 TOGGLE STATUS CABAÑA
exports.toggleStatusCabana = async (req, res) => {
  try {
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
};

// 🔄 TOGGLE STATUS AIRBNB
exports.toggleStatusAirbnb = async (req, res) => {
  try {
    const airbnb = await Airbnb.findById(req.params.id);
    
    if (!airbnb) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado'
      });
    }
    
    // Toggle el estado activo
    airbnb.activo = !airbnb.activo;
    
    // Agregar información de auditoría
    airbnb.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: airbnb.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };
    
    await airbnb.save();
    
    res.status(200).json({
      status: 'success',
      message: `Alojamiento ${airbnb.activo ? 'activado' : 'bloqueado'} exitosamente`,
      data: {
        airbnb: {
          id: airbnb._id,
          nombre: airbnb.nombre,
          activo: airbnb.activo
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🔄 TOGGLE STATUS TOUR OPERADORA
exports.toggleStatusTourOperadora = async (req, res) => {
  try {
    const tour = await TourOperadora.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({
        status: 'error',
        message: 'Tour operadora no encontrada'
      });
    }
    
    // Toggle el estado activo
    tour.activo = !tour.activo;
    
    // Agregar información de auditoría
    tour.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: tour.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };
    
    await tour.save();
    
    res.status(200).json({
      status: 'success',
      message: `Tour operadora ${tour.activo ? 'activada' : 'bloqueada'} exitosamente`,
      data: {
        tour: {
          id: tour._id,
          nombre: tour.nombre,
          activo: tour.activo
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🔄 TOGGLE STATUS GUÍA TURÍSTICA
exports.toggleStatusGuiaTuristica = async (req, res) => {
  try {
    const guia = await GuiaTuristica.findById(req.params.id);
    
    if (!guia) {
      return res.status(404).json({
        status: 'error',
        message: 'Guía turística no encontrada'
      });
    }
    
    // Toggle el estado activo
    guia.activo = !guia.activo;
    
    // Agregar información de auditoría
    guia.ultimaModificacion = {
      usuario: req.user.id,
      fecha: new Date(),
      accion: guia.activo ? 'activado' : 'bloqueado',
      motivo: 'Cambio de estado por super administrador'
    };
    
    await guia.save();
    
    res.status(200).json({
      status: 'success',
      message: `Guía ${guia.activo ? 'activada' : 'bloqueada'} exitosamente`,
      data: {
        guia: {
          id: guia._id,
          nombre: `${guia.nombre} ${guia.apellidos}`,
          activo: guia.activo
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==================== CONTROLADORES PARA ELIMINAR ESTABLECIMIENTOS + USUARIOS ====================

// 🗑️ ELIMINAR HOTEL + USUARIO
// 🔥 CAMBIO COMPLETO: Eliminación real de establecimiento Y usuario
exports.eliminarHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('propietario');
    
    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel no encontrado'
      });
    }
    
    // 🔥 NUEVO: Eliminación permanente de establecimiento Y usuario
    await Hotel.findByIdAndDelete(req.params.id);
    
    // 🔥 CRÍTICO: Eliminar también el usuario propietario
    if (hotel.propietario) {
      await User.findByIdAndDelete(hotel.propietario._id);
    }
    
    res.json({
      status: 'success',
      message: 'Hotel y usuario eliminados permanentemente',
      data: { 
        hotelId: req.params.id,
        usuarioEliminado: hotel.propietario ? hotel.propietario.email : null
      }
    });
  } catch (error) {
    console.error('Error eliminando hotel y usuario:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🗑️ ELIMINAR CABAÑA + USUARIO
// 🔥 CAMBIO COMPLETO: Eliminación real de establecimiento Y usuario
exports.eliminarCabana = async (req, res) => {
  try {
    const cabana = await Cabana.findById(req.params.id).populate('propietario');
    
    if (!cabana) {
      return res.status(404).json({
        status: 'error',
        message: 'Cabaña no encontrada'
      });
    }
    
    // 🔥 NUEVO: Eliminación permanente de establecimiento Y usuario
    await Cabana.findByIdAndDelete(req.params.id);
    
    // 🔥 CRÍTICO: Eliminar también el usuario propietario
    if (cabana.propietario) {
      await User.findByIdAndDelete(cabana.propietario._id);
    }
    
    res.json({
      status: 'success',
      message: 'Cabaña y usuario eliminados permanentemente',
      data: { 
        cabanaId: req.params.id,
        usuarioEliminado: cabana.propietario ? cabana.propietario.email : null
      }
    });
  } catch (error) {
    console.error('Error eliminando cabaña y usuario:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🗑️ ELIMINAR AIRBNB + USUARIO
// 🔥 CAMBIO COMPLETO: Eliminación real de establecimiento Y usuario
exports.eliminarAirbnb = async (req, res) => {
  try {
    const airbnb = await Airbnb.findById(req.params.id).populate('propietario');
    
    if (!airbnb) {
      return res.status(404).json({
        status: 'error',
        message: 'Alojamiento no encontrado'
      });
    }
    
    // 🔥 NUEVO: Eliminación permanente de establecimiento Y usuario
    await Airbnb.findByIdAndDelete(req.params.id);
    
    // 🔥 CRÍTICO: Eliminar también el usuario propietario
    if (airbnb.propietario) {
      await User.findByIdAndDelete(airbnb.propietario._id);
    }
    
    res.json({
      status: 'success',
      message: 'Alojamiento y usuario eliminados permanentemente',
      data: { 
        airbnbId: req.params.id,
        usuarioEliminado: airbnb.propietario ? airbnb.propietario.email : null
      }
    });
  } catch (error) {
    console.error('Error eliminando alojamiento y usuario:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🗑️ ELIMINAR TOUR OPERADORA + USUARIO
// 🔥 CAMBIO COMPLETO: Eliminación real de establecimiento Y usuario
exports.eliminarTourOperadora = async (req, res) => {
  try {
    const tour = await TourOperadora.findById(req.params.id).populate('propietario');
    
    if (!tour) {
      return res.status(404).json({
        status: 'error',
        message: 'Tour operadora no encontrada'
      });
    }
    
    // 🔥 NUEVO: Eliminación permanente de establecimiento Y usuario
    await TourOperadora.findByIdAndDelete(req.params.id);
    
    // 🔥 CRÍTICO: Eliminar también el usuario propietario
    if (tour.propietario) {
      await User.findByIdAndDelete(tour.propietario._id);
    }
    
    res.json({
      status: 'success',
      message: 'Tour operadora y usuario eliminados permanentemente',
      data: { 
        tourId: req.params.id,
        usuarioEliminado: tour.propietario ? tour.propietario.email : null
      }
    });
  } catch (error) {
    console.error('Error eliminando tour operadora y usuario:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// 🗑️ ELIMINAR GUÍA TURÍSTICA + USUARIO
// 🔥 CAMBIO COMPLETO: Eliminación real de establecimiento Y usuario
exports.eliminarGuiaTuristica = async (req, res) => {
  try {
    const guia = await GuiaTuristica.findById(req.params.id).populate('propietario');
    
    if (!guia) {
      return res.status(404).json({
        status: 'error',
        message: 'Guía turística no encontrada'
      });
    }
    
    // 🔥 NUEVO: Eliminación permanente de establecimiento Y usuario
    await GuiaTuristica.findByIdAndDelete(req.params.id);
    
    // 🔥 CRÍTICO: Eliminar también el usuario propietario
    if (guia.propietario) {
      await User.findByIdAndDelete(guia.propietario._id);
    }
    
    res.json({
      status: 'success',
      message: 'Guía turística y usuario eliminados permanentemente',
      data: { 
        guiaId: req.params.id,
        usuarioEliminado: guia.propietario ? guia.propietario.email : null
      }
    });
  } catch (error) {
    console.error('Error eliminando guía turística y usuario:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==================== CONTROLADORES PARA EL DASHBOARD ====================

// 📊 OBTENER TODOS LOS DATOS
exports.obtenerTodosLosDatos = async (req, res) => {
  try {
    const [hoteles, cabanas, airbnb, tours, guias] = await Promise.all([
      Hotel.find({}).populate('propietario', 'nombre email'),
      Cabana.find({}).populate('propietario', 'nombre email'),
      Airbnb.find({}).populate('propietario', 'nombre email'),
      TourOperadora.find({}).populate('propietario', 'nombre email'),
      GuiaTuristica.find({}).populate('propietario', 'nombre email')
    ]);
    
    res.json({
      status: 'success',
      data: {
        hoteles,
        cabanas,
        airbnb,
        tours,
        guias
      }
    });
  } catch (error) {
    console.error('Error obteniendo todos los datos:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// 📈 OBTENER ESTADÍSTICAS
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Promise.all([
      Hotel.countDocuments({ activo: true }),
      Hotel.countDocuments({ activo: false }),
      Cabana.countDocuments({ activo: true }),
      Cabana.countDocuments({ activo: false }),
      Airbnb.countDocuments({ activo: true }),
      Airbnb.countDocuments({ activo: false }),
      TourOperadora.countDocuments({ activo: true }),
      TourOperadora.countDocuments({ activo: false }),
      GuiaTuristica.countDocuments({ activo: true }),
      GuiaTuristica.countDocuments({ activo: false })
    ]);
    
    res.json({
      status: 'success',
      data: {
        hoteles: { activos: estadisticas[0], inactivos: estadisticas[1] },
        cabanas: { activos: estadisticas[2], inactivos: estadisticas[3] },
        airbnb: { activos: estadisticas[4], inactivos: estadisticas[5] },
        tours: { activos: estadisticas[6], inactivos: estadisticas[7] },
        guias: { activos: estadisticas[8], inactivos: estadisticas[9] }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};