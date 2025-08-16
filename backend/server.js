const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

console.log('🚀 Iniciando servidor...');

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(cors());

// ✅ Servir archivos estáticos - BÁSICO
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ✅ Ruta API de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API funcionando - versión mínima',
    status: 'success'
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
});