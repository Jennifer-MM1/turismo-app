const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir la contraseña en las consultas por defecto
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tipoNegocio: {
    type: String,
    enum: ['hotel', 'cabana', 'ayb', 'touroperadora', 'guiaturistica', 'administracion'],
    required: function() {
      return this.role === 'admin';
    }
  },
  activo: {
    type: Boolean,
    default: true
  },
  // 🔥 NUEVO CAMPO: Campo para identificar super administradores
  isSuperAdmin: {
    type: Boolean,
    default: false,
    select: true // Incluir en las consultas para verificación
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Cifrar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  // Solo cifrar si la contraseña fue modificada
  if (!this.isModified('password')) return next();
  
  // Cifrar con costo de 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar contraseñas
UserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 🔥 NUEVO MÉTODO: Verificar si es super administrador
UserSchema.methods.isSuperAdministrator = function() {
  return this.email === 'direcciondeturismojalpan@gmail.com' || this.isSuperAdmin === true;
};

// 🔥 NUEVO MÉTODO: Obtener tipo de dashboard
UserSchema.methods.getDashboardType = function() {
  if (this.isSuperAdministrator()) {
    return 'super-admin';
  } else if (this.role === 'admin') {
    return 'admin';
  } else {
    return 'user';
  }
};

module.exports = mongoose.model('User', UserSchema);