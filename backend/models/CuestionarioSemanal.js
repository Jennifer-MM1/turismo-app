const mongoose = require('mongoose');

const cuestionarioSemanalSchema = new mongoose.Schema({
  // CAMPOS COMUNES
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El propietario es requerido']
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin es requerida']
  },
  semanaAnio: {
    type: String,
    required: [true, 'La semana-año es requerida'],
    match: [/^\d{4}-W\d{2}$/, 'Formato de semana-año inválido']
  },
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  
  // TIPO DE ESTABLECIMIENTO - ✅ YA ACTUALIZADO
  tipoEstablecimiento: {
    type: String,
    required: [true, 'El tipo de establecimiento es requerido'],
    enum: ['hotel', 'airbnb', 'cabana'],
    default: 'hotel'
  },
  
  // REFERENCIA AL ESTABLECIMIENTO - ✅ YA ACTUALIZADO
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: function() {
      return this.tipoEstablecimiento === 'hotel';
    }
  },
  
  alojamiento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airbnb',
    required: function() {
      return this.tipoEstablecimiento === 'airbnb';
    }
  },
  
  cabana: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabana',
    required: function() {
      return this.tipoEstablecimiento === 'cabana';
    }
  },
  
  // DATOS DEL CUESTIONARIO (Estructura unificada)
  datos: {
    // ✅ NUEVO: CAMPO COMÚN PARA TODOS LOS TIPOS DE ESTABLECIMIENTO
    procedenciaTuristas: {
      type: String,
      required: [true, 'La procedencia de turistas es requerida'],
      trim: true,
      maxlength: [500, 'La descripción de procedencia no puede exceder 500 caracteres'],
      minlength: [10, 'Por favor proporcione más detalles sobre la procedencia de los turistas']
    },
    
    // PARA HOTELES (estructura original)
    habitacionesOcupadas: {
      type: Number,
      min: [0, 'Las habitaciones ocupadas no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    habitacionesNacionales: {
      type: Number,
      min: [0, 'Las habitaciones nacionales no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    habitacionesExtranjeros: {
      type: Number,
      min: [0, 'Las habitaciones extranjeras no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    totalPersonas: {
      type: Number,
      min: [0, 'El total de personas no puede ser negativo'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    turistasNacionales: {
      type: Number,
      min: [0, 'Los turistas nacionales no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    turistasExtranjeros: {
      type: Number,
      min: [0, 'Los turistas extranjeros no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    turistasAlMenosUnaNoche: {
      type: Number,
      min: [0, 'Los turistas que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    turistasNacionalesNoche: {
      type: Number,
      min: [0, 'Los turistas nacionales que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    turistasExtranjerosNoche: {
      type: Number,
      min: [0, 'Los turistas extranjeros que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'hotel';
      }
    },
    
    // PARA AIRBNB (nueva estructura)
    ocupacionesSemana: {
      type: Number,
      min: [0, 'Las ocupaciones no pueden ser negativas'],
      max: [7, 'No puede haber más de 7 ocupaciones por semana'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    ocupacionesNacionales: {
      type: Number,
      min: [0, 'Las ocupaciones nacionales no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    ocupacionesExtranjeros: {
      type: Number,
      min: [0, 'Las ocupaciones extranjeras no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    totalPersonasSemana: {
      type: Number,
      min: [0, 'El total de personas no puede ser negativo'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    personasNacionales: {
      type: Number,
      min: [0, 'Las personas nacionales no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    personasExtranjeros: {
      type: Number,
      min: [0, 'Las personas extranjeras no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    turistasPernoctaron: {
      type: Number,
      min: [0, 'Los turistas que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    turistasNacionalesPernoctaron: {
      type: Number,
      min: [0, 'Los turistas nacionales que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    turistasExtranjerosPernoctaron: {
      type: Number,
      min: [0, 'Los turistas extranjeros que pernoctaron no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'airbnb';
      }
    },
    
    
    // ✅ NUEVO: PARA CABAÑAS (estructura específica)
    diasOcupada: {
      type: Number,
      min: [0, 'Los días ocupados no pueden ser negativos'],
      max: [7, 'No puede haber más de 7 días por semana'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    },
    ocupacionNacionales: {
      type: Number,
      min: [0, 'Los días nacionales no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    },
    ocupacionExtranjeros: {
      type: Number,
      min: [0, 'Los días extranjeros no pueden ser negativos'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    },
    // Nota: Para cabañas usamos el mismo campo totalPersonas que hoteles
    // turistasNacionales y turistasExtranjeros también se reutilizan
    totalPernoctaciones: {
      type: Number,
      min: [0, 'Las pernoctaciones no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    },
    pernoctacionesNacionales: {
      type: Number,
      min: [0, 'Las pernoctaciones nacionales no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    },
    pernoctacionesExtranjeros: {
      type: Number,
      min: [0, 'Las pernoctaciones extranjeras no pueden ser negativas'],
      required: function() {
        return this.tipoEstablecimiento === 'cabana';
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔒 ÍNDICES SEGUROS - NO CAUSAN CONFLICTO (VERSIÓN ROBUSTA)
// Cada tipo de establecimiento tiene su propio índice único con validación estricta

// Para HOTELES: hotel + semana debe ser único
cuestionarioSemanalSchema.index(
  { hotel: 1, semanaAnio: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      tipoEstablecimiento: 'hotel',
      hotel: { $exists: true, $type: 'objectId' }
    },
    name: 'hotel_semana_unique'
  }
);

// Para AIRBNB: alojamiento + semana debe ser único 
cuestionarioSemanalSchema.index(
  { alojamiento: 1, semanaAnio: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      tipoEstablecimiento: 'airbnb',
      alojamiento: { $exists: true, $type: 'objectId' }
    },
    name: 'airbnb_semana_unique'
  }
);

// Para CABAÑAS: cabana + semana debe ser único
cuestionarioSemanalSchema.index(
  { cabana: 1, semanaAnio: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      tipoEstablecimiento: 'cabana',
      cabana: { $exists: true, $type: 'objectId' }
    },
    name: 'cabana_semana_unique'
  }
);

// Índices adicionales (mantener)
cuestionarioSemanalSchema.index({ propietario: 1, fechaInicio: -1 });
cuestionarioSemanalSchema.index({ semanaAnio: 1 });
cuestionarioSemanalSchema.index({ tipoEstablecimiento: 1 });

// ✅ ACTUALIZADO: VALIDACIONES PRE-SAVE - INCLUIR CABAÑAS Y PROCEDENCIA
cuestionarioSemanalSchema.pre('save', function(next) {
  const datos = this.datos;
  
  console.log('🔍 Validando cuestionario:', this.tipoEstablecimiento);
  
  // ✅ VALIDACIÓN COMÚN: Verificar que la procedencia no esté vacía
  if (!datos.procedenciaTuristas || datos.procedenciaTuristas.trim().length < 10) {
    return next(new Error('Debe proporcionar información detallada sobre la procedencia de los turistas'));
  }
  
  // VALIDACIONES PARA HOTELES
  if (this.tipoEstablecimiento === 'hotel') {
    // Validar que habitaciones nacionales + extranjeras = total habitaciones
    if (datos.habitacionesNacionales + datos.habitacionesExtranjeros !== datos.habitacionesOcupadas) {
      return next(new Error('La suma de habitaciones nacionales y extranjeras debe ser igual al total de habitaciones ocupadas'));
    }
    
    // Validar que turistas nacionales + extranjeros = total turistas
    if (datos.turistasNacionales + datos.turistasExtranjeros !== datos.totalPersonas) {
      return next(new Error('La suma de turistas nacionales y extranjeros debe ser igual al total de personas'));
    }
    
    // Validar que turistas noche nacionales + extranjeros = total turistas noche
    if (datos.turistasNacionalesNoche + datos.turistasExtranjerosNoche !== datos.turistasAlMenosUnaNoche) {
      return next(new Error('La suma de turistas nacionales y extranjeros que pernoctaron debe ser igual al total que pernoctaron'));
    }
  }
  
  // VALIDACIONES PARA AIRBNB
  if (this.tipoEstablecimiento === 'airbnb') {
    // Validar que ocupaciones nacionales + extranjeras = total ocupaciones
    if (datos.ocupacionesNacionales + datos.ocupacionesExtranjeros !== datos.ocupacionesSemana) {
      return next(new Error('La suma de ocupaciones nacionales y extranjeras debe ser igual al total de ocupaciones'));
    }
    
    // Validar que personas nacionales + extranjeras = total personas
    if (datos.personasNacionales + datos.personasExtranjeros !== datos.totalPersonasSemana) {
      return next(new Error('La suma de personas nacionales y extranjeras debe ser igual al total de personas'));
    }
    
    // Validar que turistas nacionales + extranjeros que pernoctaron = total que pernoctaron
    if (datos.turistasNacionalesPernoctaron + datos.turistasExtranjerosPernoctaron !== datos.turistasPernoctaron) {
      return next(new Error('La suma de turistas nacionales y extranjeros que pernoctaron debe ser igual al total que pernoctaron'));
    }
    
    // Validar que no puede haber más personas que pernoctaron que personas totales
    if (datos.turistasPernoctaron > datos.totalPersonasSemana) {
      return next(new Error('No puede haber más turistas que pernoctaron que el total de personas'));
    }
  }
  
  // ✅ NUEVO: VALIDACIONES PARA CABAÑAS
  if (this.tipoEstablecimiento === 'cabana') {
    // Validar que días nacionales + extranjeros = total días
    if (datos.ocupacionNacionales + datos.ocupacionExtranjeros !== datos.diasOcupada) {
      return next(new Error('La suma de días nacionales y extranjeros debe ser igual al total de días ocupados'));
    }
    
    // Validar que turistas nacionales + extranjeros = total turistas
    if (datos.turistasNacionales + datos.turistasExtranjeros !== datos.totalPersonas) {
      return next(new Error('La suma de turistas nacionales y extranjeros debe ser igual al total de personas'));
    }
    
    // Validar que pernoctaciones nacionales + extranjeras = total pernoctaciones
    if (datos.pernoctacionesNacionales + datos.pernoctacionesExtranjeros !== datos.totalPernoctaciones) {
      return next(new Error('La suma de pernoctaciones nacionales y extranjeras debe ser igual al total'));
    }
    
    // Validar que no haya más pernoctaciones que personas totales
    if (datos.totalPernoctaciones > datos.totalPersonas) {
      return next(new Error('No puede haber más pernoctaciones que el total de personas'));
    }
    
    // Validar que los días ocupados no excedan 7
    if (datos.diasOcupada > 7) {
      return next(new Error('No puede haber más de 7 días ocupados por semana'));
    }
  }
  
  console.log('✅ Validaciones pasadas correctamente');
  next();
});

// ✅ ACTUALIZADO: VIRTUALS para cálculos automáticos - INCLUIR CABAÑAS
cuestionarioSemanalSchema.virtual('porcentajeOcupacionNacional').get(function() {
  if (this.tipoEstablecimiento === 'hotel') {
    if (this.datos.habitacionesOcupadas === 0) return 0;
    return Math.round((this.datos.habitacionesNacionales / this.datos.habitacionesOcupadas) * 100);
  } else if (this.tipoEstablecimiento === 'airbnb') {
    if (this.datos.ocupacionesSemana === 0) return 0;
    return Math.round((this.datos.ocupacionesNacionales / this.datos.ocupacionesSemana) * 100);
  } else if (this.tipoEstablecimiento === 'cabana') {
    if (this.datos.diasOcupada === 0) return 0;
    return Math.round((this.datos.ocupacionNacionales / this.datos.diasOcupada) * 100);
  }
  return 0;
});

cuestionarioSemanalSchema.virtual('porcentajeOcupacionExtranjera').get(function() {
  if (this.tipoEstablecimiento === 'hotel') {
    if (this.datos.habitacionesOcupadas === 0) return 0;
    return Math.round((this.datos.habitacionesExtranjeros / this.datos.habitacionesOcupadas) * 100);
  } else if (this.tipoEstablecimiento === 'airbnb') {
    if (this.datos.ocupacionesSemana === 0) return 0;
    return Math.round((this.datos.ocupacionesExtranjeros / this.datos.ocupacionesSemana) * 100);
  } else if (this.tipoEstablecimiento === 'cabana') {
    if (this.datos.diasOcupada === 0) return 0;
    return Math.round((this.datos.ocupacionExtranjeros / this.datos.diasOcupada) * 100);
  }
  return 0;
});

// ✅ ACTUALIZADO: Virtual para obtener el establecimiento - INCLUIR CABAÑAS
cuestionarioSemanalSchema.virtual('establecimiento').get(function() {
  if (this.tipoEstablecimiento === 'hotel') {
    return this.hotel;
  } else if (this.tipoEstablecimiento === 'airbnb') {
    return this.alojamiento;
  } else if (this.tipoEstablecimiento === 'cabana') {
    return this.cabana;
  }
  return null;
});

// Virtual para obtener la semana del año
cuestionarioSemanalSchema.virtual('numeroSemana').get(function() {
  return parseInt(this.semanaAnio.split('-W')[1]);
});

// Virtual para obtener el año
cuestionarioSemanalSchema.virtual('año').get(function() {
  return parseInt(this.semanaAnio.split('-W')[0]);
});

// ✅ NUEVO: Virtual para obtener un resumen de procedencia
cuestionarioSemanalSchema.virtual('resumenProcedencia').get(function() {
  if (!this.datos.procedenciaTuristas) return 'No especificado';
  
  // Si el texto es muy largo, mostrar solo los primeros 100 caracteres
  if (this.datos.procedenciaTuristas.length > 100) {
    return this.datos.procedenciaTuristas.substring(0, 100) + '...';
  }
  
  return this.datos.procedenciaTuristas;
});

// ✅ ACTUALIZADO: MÉTODO ESTÁTICO para buscar por establecimiento - INCLUIR CABAÑAS
cuestionarioSemanalSchema.statics.findByEstablecimiento = function(establecimientoId, tipo) {
  let query = {};
  let populateField = '';
  
  if (tipo === 'hotel') {
    query.hotel = establecimientoId;
    populateField = 'hotel';
  } else if (tipo === 'airbnb') {
    query.alojamiento = establecimientoId;
    populateField = 'alojamiento';
  } else if (tipo === 'cabana') {
    query.cabana = establecimientoId;
    populateField = 'cabana';
  }
  
  return this.find(query).populate(populateField);
};

// ✅ NUEVO: Método estático para obtener estadísticas de procedencia
cuestionarioSemanalSchema.statics.getEstadisticasProcedencia = function(filtros = {}) {
  const pipeline = [
    { $match: filtros },
    {
      $group: {
        _id: '$datos.procedenciaTuristas',
        count: { $sum: 1 },
        tiposEstablecimiento: { $addToSet: '$tipoEstablecimiento' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 } // Top 20 procedencias más comunes
  ];
  
  return this.aggregate(pipeline);
};

// Middleware para logging
cuestionarioSemanalSchema.post('save', function(doc) {
  console.log(`✅ Cuestionario ${doc.tipoEstablecimiento} guardado:`, doc._id);
  console.log(`📍 Procedencia: ${doc.datos.procedenciaTuristas?.substring(0, 50)}...`);
});

module.exports = mongoose.model('CuestionarioSemanal', cuestionarioSemanalSchema);