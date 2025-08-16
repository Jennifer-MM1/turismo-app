// authMiddleware.js - Versión completa con Super Admin
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rutas (verificar si está autenticado)
exports.protect = async (req, res, next) => {
  try {
    console.log('🔐 Middleware protect ejecutado');
    console.log('Headers recibidos:', req.headers.authorization);
    
    // 1) Obtener token del header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    console.log('Token extraído:', token ? 'Token presente' : 'No hay token');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No estás autenticado. Por favor inicia sesión.'
      });
    }
    
    // 2) Verificar token
    console.log('Verificando token con secret:', process.env.JWT_SECRET ? 'Secret presente' : 'NO HAY SECRET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    // 3) Verificar si el usuario aún existe
    const currentUser = await User.findById(decoded.id);
    console.log('Usuario encontrado:', currentUser ? currentUser.email : 'Usuario no encontrado');
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'El usuario ya no existe'
      });
    }
    
    // 4) Verificar si el usuario está activo
    if (!currentUser.activo) {
      return res.status(401).json({
        status: 'error',
        message: 'Tu cuenta ha sido desactivada'
      });
    }
    
    // 🔥 NUEVO: Agregar información de super admin al request
    req.user = currentUser;
    req.user.isSuperAdministrator = currentUser.isSuperAdministrator ? currentUser.isSuperAdministrator() : false;
    
    console.log('✅ Usuario autenticado:', currentUser.email, 'Role:', currentUser.role, 'Super Admin:', req.user.isSuperAdministrator);
    next();
  } catch (error) {
    console.error('❌ Error en middleware protect:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido: ' + error.message
    });
  }
};

// Restringir acceso a ciertos roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('🔒 Middleware restrictTo ejecutado');
    console.log('Roles permitidos:', roles);
    console.log('Role del usuario:', req.user?.role);
    console.log('Es Super Admin:', req.user?.isSuperAdministrator);
    
    // 🔥 MEJORADO: Super admin tiene acceso a todo
    if (req.user?.isSuperAdministrator) {
      console.log('🔥 Super Admin detectado - Acceso total permitido');
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `No tienes permiso para realizar esta acción. Tu role: ${req.user.role}, roles permitidos: ${roles.join(', ')}`
      });
    }
    
    console.log('✅ Usuario autorizado');
    next();
  };
};

// 🔥 NUEVO: Middleware específico para super administradores
exports.requireSuperAdmin = (req, res, next) => {
  console.log('👑 Middleware requireSuperAdmin ejecutado');
  console.log('Usuario:', req.user?.email);
  console.log('Es Super Admin:', req.user?.isSuperAdministrator);
  
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Debes estar autenticado para acceder a esta función'
    });
  }
  
  // Verificar si es super admin por email o campo
  const isSuperAdmin = req.user.email === 'direcciondeturismojalpan@gmail.com' || req.user.isSuperAdmin === true;
  
  if (!isSuperAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Acceso denegado. Solo Super Administradores pueden realizar esta acción.'
    });
  }
  
  console.log('👑 Super Admin verificado - Acceso concedido');
  next();
};

// 🔥 NUEVO: Middleware para verificar propietario o super admin
exports.checkOwnershipOrSuperAdmin = (Model) => {
  return async (req, res, next) => {
    try {
      console.log('🔍 Verificando propiedad o super admin...');
      console.log('Usuario ID:', req.user.id);
      console.log('Recurso ID:', req.params.id);
      console.log('Es Super Admin:', req.user?.isSuperAdministrator);
      
      // Si es super admin, permitir acceso
      if (req.user?.isSuperAdministrator) {
        console.log('🔥 Super Admin - Saltando verificación de propiedad');
        return next();
      }
      
      // Verificar si el recurso existe y pertenece al usuario
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Recurso no encontrado'
        });
      }
      
      if (resource.propietario.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para acceder a este recurso'
        });
      }
      
      console.log('✅ Propietario verificado');
      next();
    } catch (error) {
      console.error('❌ Error verificando propiedad:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor'
      });
    }
  };
};

// 🔥 NUEVO: Middleware para auditoría (registrar acciones del super admin)
exports.auditAction = (action) => {
  return (req, res, next) => {
    // Almacenar información de auditoría en el request
    req.auditInfo = {
      action: action,
      userId: req.user?.id,
      userEmail: req.user?.email,
      isSuperAdmin: req.user?.isSuperAdministrator,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    console.log('📝 Acción auditada:', req.auditInfo);
    next();
  };
};

// 🔥 NUEVO: Función de utilidad para verificar permisos en controladores
exports.hasPermission = (user, requiredRole = null, requireSuperAdmin = false) => {
  // Si se requiere super admin específicamente
  if (requireSuperAdmin) {
    return user.email === 'direcciondeturismojalpan@gmail.com' || user.isSuperAdmin === true;
  }
  
  // Si es super admin, tiene todos los permisos
  if (user.email === 'direcciondeturismojalpan@gmail.com' || user.isSuperAdmin === true) {
    return true;
  }
  
  // Verificar rol específico
  if (requiredRole) {
    return user.role === requiredRole;
  }
  
  return true;
};

// 🔥 NUEVO: Middleware de debugging para desarrollo
exports.debugUser = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 DEBUG USER INFO:');
    console.log('- ID:', req.user?.id);
    console.log('- Email:', req.user?.email);
    console.log('- Role:', req.user?.role);
    console.log('- Tipo Negocio:', req.user?.tipoNegocio);
    console.log('- Es Super Admin:', req.user?.isSuperAdministrator);
    console.log('- Activo:', req.user?.activo);
    console.log('- Token presente:', !!req.headers.authorization);
  }
  next();
};