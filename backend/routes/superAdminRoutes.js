// routes/superAdminRoutes.js
const express = require('express');
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔒 TODAS LAS RUTAS REQUIEREN SUPER ADMIN
router.use(authMiddleware.protect);
router.use(authMiddleware.requireSuperAdmin);

// ==================== CREAR ESTABLECIMIENTOS + USUARIOS ====================

// 🏨 Crear Hotel + Usuario
router.post('/crear-hotel-con-usuario', superAdminController.crearHotelConUsuario);

// 🏔️ Crear Cabaña + Usuario  
router.post('/crear-cabana-con-usuario', superAdminController.crearCabanaConUsuario);

// 🏠 Crear Airbnb + Usuario
router.post('/crear-airbnb-con-usuario', superAdminController.crearAirbnbConUsuario);

// 👨‍💼 Crear Guía Turística + Usuario
router.post('/crear-guia-con-usuario', superAdminController.crearGuiaConUsuario);

// 🚌 Crear Tour Operadora + Usuario
router.post('/crear-tour-con-usuario', superAdminController.crearTourConUsuario);

// ==================== GESTIÓN DE PROPIEDADES ====================

// 🔄 Transferir propiedad de establecimiento
router.patch('/transferir-propiedad', superAdminController.transferirPropiedad);

// ==================== RUTAS PARA TOGGLE STATUS (BLOQUEAR/ACTIVAR) ====================
// 🔥 NUEVAS RUTAS AGREGADAS

// 🔄 Toggle Status Hotel
router.patch('/hoteles/:id/toggle-status', superAdminController.toggleStatusHotel);

// 🔄 Toggle Status Cabaña
router.patch('/cabanas/:id/toggle-status', superAdminController.toggleStatusCabana);

// 🔄 Toggle Status Airbnb
router.patch('/airbnb/:id/toggle-status', superAdminController.toggleStatusAirbnb);

// 🔄 Toggle Status Tour Operadora
router.patch('/tours/:id/toggle-status', superAdminController.toggleStatusTourOperadora);

// 🔄 Toggle Status Guía Turística  
router.patch('/guias/:id/toggle-status', superAdminController.toggleStatusGuiaTuristica);

// ==================== RUTAS PARA ELIMINAR ESTABLECIMIENTOS + USUARIOS ====================

// 🗑️ Eliminar Hotel + Usuario
router.delete('/hoteles/:id', superAdminController.eliminarHotel);

// 🗑️ Eliminar Cabaña + Usuario
router.delete('/cabanas/:id', superAdminController.eliminarCabana);

// 🗑️ Eliminar Airbnb + Usuario
router.delete('/airbnb/:id', superAdminController.eliminarAirbnb);

// 🗑️ Eliminar Tour Operadora + Usuario
router.delete('/tours/:id', superAdminController.eliminarTourOperadora);

// 🗑️ Eliminar Guía Turística + Usuario
router.delete('/guias/:id', superAdminController.eliminarGuiaTuristica);

// ==================== RUTAS PARA OBTENER TODOS LOS DATOS ====================

// 📊 Obtener todos los establecimientos (para el dashboard)
router.get('/todos-los-datos', superAdminController.obtenerTodosLosDatos);

// 📈 Obtener estadísticas generales
router.get('/estadisticas', superAdminController.obtenerEstadisticas);

// ✅ EXPORTAR AL FINAL - DESPUÉS DE TODAS LAS RUTAS
module.exports = router;