const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función para crear JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Función para enviar respuesta con token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remover contraseña de la respuesta
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Registro de usuario
exports.signup = async (req, res) => {
  try {
    const { nombre, email, password, role, tipoNegocio } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un usuario con este email'
      });
    }
    
    const newUser = await User.create({
      nombre,
      email,
      password,
      role,
      tipoNegocio
    });
    
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1) Verificar que email y password existan
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Por favor proporciona email y contraseña'
      });
    }
    
    // 2) Verificar si el usuario existe y la contraseña es correcta
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // 3) Si todo está bien, enviar token
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Obtener usuario actual
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
