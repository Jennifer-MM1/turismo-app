// Forzar rebuild - versión corregida
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

console.log('🚀 Iniciando servidor...');

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// ✅ Servir archivos estáticos desde frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// ✅ IMPORTANTE: Configuración específica para imágenes
app.use('/uploads/hoteles', express.static(path.join(__dirname, '../frontend/public/uploads/hoteles')));
app.use('/uploads/cabanas', express.static(path.join(__dirname, '../frontend/public/uploads/cabanas')));
app.use('/uploads/airbnb', express.static(path.join(__dirname, '../frontend/public/uploads/airbnb')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// 🆕 Servir imágenes desde img_jalpan
app.use('/img_jalpan', express.static(path.join(__dirname, '../img_jalpan')));


// ✅ Test API súper directo - SIN REQUIRES
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test directo funcionando', 
    status: 'success',
    timestamp: new Date().toISOString()
  });
});
// ✅ Rutas API - agregando gradualmente
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hoteles', require('./routes/hotelRoutes'));
app.use('/api/cabanas', require('./routes/cabanaRoutes'));
app.use('/api/airbnb', require('./routes/airbnbRoutes'));

// ✅ Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ✅ Ruta API de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Turismo funcionando correctamente',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// ✅ Ruta catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Info: http://localhost:${PORT}/api`);
  console.log(`📂 Archivos estáticos servidos desde /frontend`);
  console.log(`🖼️ Imágenes de Jalpan: /img_jalpan`);
  console.log('✅ Server.js cargado completamente - versión actualizada v2'); // ← AGREGA ESTA LÍNEA
});