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

// ✅ Servir archivos estáticos - CORREGIDO CON ../
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// ✅ IMPORTANTE: Configuración específica para imágenes - CORREGIDO CON ../
app.use('/uploads/hoteles', express.static(path.join(__dirname, '../frontend/public/uploads/hoteles')));
app.use('/uploads/cabanas', express.static(path.join(__dirname, '../frontend/public/uploads/cabanas')));
app.use('/uploads/airbnb', express.static(path.join(__dirname, '../frontend/public/uploads/airbnb')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// ✅ RUTAS DE DEBUG: Para verificar imágenes - CORREGIDO CON ../
app.get('/debug/images/hoteles/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '../frontend/public/uploads/hoteles', filename);
  
  if (fs.existsSync(imagePath)) {
    res.json({
      exists: true,
      path: imagePath,
      url: `/uploads/hoteles/${filename}`,
      size: fs.statSync(imagePath).size
    });
  } else {
    res.status(404).json({
      exists: false,
      path: imagePath
    });
  }
});

app.get('/debug/images/cabanas/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '../frontend/public/uploads/cabanas', filename);
  
  if (fs.existsSync(imagePath)) {
    res.json({
      exists: true,
      path: imagePath,
      url: `/uploads/cabanas/${filename}`,
      size: fs.statSync(imagePath).size
    });
  } else {
    res.status(404).json({
      exists: false,
      path: imagePath
    });
  }
});

// 🆕 NUEVO: Ruta de debug para Airbnb - CORREGIDO CON ../
app.get('/debug/images/airbnb/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '../frontend/public/uploads/airbnb', filename);
  
  if (fs.existsSync(imagePath)) {
    res.json({
      exists: true,
      path: imagePath,
      url: `/uploads/airbnb/${filename}`,
      size: fs.statSync(imagePath).size
    });
  } else {
    res.status(404).json({
      exists: false,
      path: imagePath
    });
  }
});

// ✅ Rutas API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hoteles', require('./routes/hotelRoutes'));
app.use('/api/cabanas', require('./routes/cabanaRoutes'));
app.use('/api/airbnb', require('./routes/airbnbRoutes'));
app.use('/api/tours', require('./routes/tourOperadoraRoutes'));
app.use('/api/guias', require('./routes/guiaTuristicaRoutes'));
app.use('/api/cuestionarios', require('./routes/cuestionarioRoutes'));
// 🔥 NUEVA LÍNEA: Agregar esta ruta para Super Admin
app.use('/api/super-admin', require('./routes/superAdminRoutes'));

// ✅ Ruta principal - CORREGIDO CON ../
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ✅ Ruta API de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Turismo funcionando correctamente',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      hoteles: '/api/hoteles',
      cabanas: '/api/cabanas',
      airbnb: '/api/airbnb',
      tours: '/api/tours',
      guias: '/api/guias'
    }
  });
});

const PORT = process.env.PORT || 5000;

// ✅ Ruta catch-all para SPA - CORREGIDO CON ../
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Info: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🏨 Hoteles: http://localhost:${PORT}/api/hoteles`);
  console.log(`🏕️ Cabañas: http://localhost:${PORT}/api/cabanas`);
  console.log(`🏠 Airbnb: http://localhost:${PORT}/api/airbnb`);
  console.log(`🚌 Tours: http://localhost:${PORT}/api/tours`);
  console.log(`👨‍🏫 Guías: http://localhost:${PORT}/api/guias`);
  console.log(`📂 Archivos estáticos servidos desde /frontend`);
  console.log(`🖼️ Imágenes de hoteles: /uploads/hoteles`);
  console.log(`🏕️ Imágenes de cabañas: /uploads/cabanas`);
  console.log(`🏠 Imágenes de Airbnb: /uploads/airbnb`);
});