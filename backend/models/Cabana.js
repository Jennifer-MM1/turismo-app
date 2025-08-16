const mongoose = require('mongoose');

const CabanaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la cabaña es obligatorio'],
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
    type: String
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
  
  // ✅ SERVICIOS COMO ARRAY (igual que Airbnb exitoso)
  servicios: [{
    type: String,
    enum: [
      'wifi', 
      'estacionamiento', 
      'aireacondicionado', 
      'restaurante', 
      'piscina', 
      'mascotas', 
      'transporte', 
      'accesibilidad', 
      'television', 
      'eventos', 
      'gimnasio', 
      'spa', 
      'desayuno',
      // Servicios específicos de cabañas
      'cocina', 
      'chimenea', 
      'bbq', 
      'calefaccion', 
      'jardin', 
      'terraza'
    ]
  }],
  
  // ✅ NUEVO: MÉTODOS DE PAGO (igual que Airbnb y Hoteles)
  metodosPago: [{
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta']
  }],
  
  contacto: {
    telefono: {
      type: String,
      match: [/^\d{10}$/, 'El teléfono debe tener 10 dígitos']
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido']
    },
    sitioWeb: String,
    horario: String
  },
  capacidad: {
    huespedes: {
      type: Number,
      required: true,
      min: [1, 'Debe haber al menos 1 huésped']
    },
    habitaciones: {
      type: Number,
      required: true,
      min: [1, 'Debe haber al menos 1 habitación']
    },
    camas: {
      type: Number,
      min: [0, 'El número de camas no puede ser negativo']
    }
  },
  caracteristicas: {
    metrosCuadrados: {
      type: Number,
      min: [0, 'Los metros cuadrados no pueden ser negativos']
    },
    tipoPropiedad: {
      type: String,
      enum: ['cabana', 'casa_rural', 'chalet', 'bungalow']
    },
    esConjunto: {
      type: Boolean,
      default: false
    }
  },
  
  // Disponibilidad para conjuntos
  conjunto: {
    totalCabanas: {
      type: Number,
      min: 1,
      default: 1
    },
    cabanasDisponibles: {
      type: Number,
      min: 0,
      default: function() {
        return this.conjunto?.totalCabanas || 1;
      }
    }
  },
  
  // Disponibilidad individual
  individual: {
    disponible: {
      type: Boolean,
      default: true
    }
  },
  
  calificacion: {
    promedio: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    numeroReviews: {
      type: Number,
      default: 0
    }
  },
  
  esEcologico: {
    type: Boolean,
    default: false,
    index: true
  },
  
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimización
CabanaSchema.index({ 'ubicacion.ciudad': 1 });
CabanaSchema.index({ precio: 1 });
CabanaSchema.index({ 'calificacion.promedio': -1 });
CabanaSchema.index({ esEcologico: 1 });
CabanaSchema.index({ 'caracteristicas.esConjunto': 1 });
CabanaSchema.index({ 'conjunto.cabanasDisponibles': 1 });
CabanaSchema.index({ 'individual.disponible': 1 });

// Método virtual para disponibilidad
CabanaSchema.virtual('disponibilidad').get(function() {
  if (this.caracteristicas.esConjunto) {
    return {
      tipo: 'conjunto',
      total: this.conjunto.totalCabanas,
      disponibles: this.conjunto.cabanasDisponibles,
      ocupadas: this.conjunto.totalCabanas - this.conjunto.cabanasDisponibles
    };
  } else {
    return {
      tipo: 'individual',
      disponible: this.individual.disponible
    };
  }
});

// Método para actualizar disponibilidad
CabanaSchema.methods.actualizarDisponibilidad = function(nuevaDisponibilidad) {
  if (this.caracteristicas.esConjunto) {
    this.conjunto.cabanasDisponibles = Math.max(0, Math.min(nuevaDisponibilidad, this.conjunto.totalCabanas));
  } else {
    this.individual.disponible = Boolean(nuevaDisponibilidad);
  }
  return this.save();
};

module.exports = mongoose.model('Cabana', CabanaSchema);