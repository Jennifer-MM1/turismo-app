const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del hotel es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  imagenes: [{
    type: String // URLs de las imágenes
  }],
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ubicacion: {
    direccion: String,
    ciudad: String,
    estado: String,
    codigoPostal: String
  },
  servicios: [{
    type: String,
    enum: ['wifi', 'piscina', 'gym', 'spa', 'restaurante', 'bar', 'estacionamiento', 'aireacondicionado', 'television', 'desayuno']
  }],
  contacto: {
    telefono: {
      type: String,
      match: [/^\d{10}$/, 'El teléfono debe tener 10 dígitos']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    sitioWeb: String
  },
  capacidad: {
    habitaciones: Number,
    personasMax: Number
  },
  calificacion: {
    promedio: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  // 🌿 NUEVO CAMPO: Etiqueta de alojamiento ecológico
  esEcologico: {
    type: Boolean,
    default: false,
    index: true // Índice para búsquedas rápidas por este filtro
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas por ubicación
HotelSchema.index({ 'ubicacion.ciudad': 1 });
HotelSchema.index({ precio: 1 });
HotelSchema.index({ calificacion: -1 });
// Nuevo índice para filtrar hoteles ecológicos
HotelSchema.index({ esEcologico: 1 });

module.exports = mongoose.model('Hotel', HotelSchema);