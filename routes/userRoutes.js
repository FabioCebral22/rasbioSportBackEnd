const express = require('express');
const router = express.Router();
const db = require('../connection');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


router.get('/users/user', async (req,res) =>{
  try {
    const { correo, contraseña } = req.body;
    const user = await db.oneOrNone('SELECT * FROM usuari WHERE user_email = $1 AND user_password = $2', [correo, contraseña]);
    res.json(user)
  }catch (error) {
    console.error(error);
    res.status(500).json({error: 'Error al obtener datos de tu usuario'})
  }
})

//TODOS LOS USUARIOS
router.get('/users', async (req, res) => {
  try {
    const data = await db.any('SELECT * FROM usuari');
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos de usuarios' });
  }
});

// Configura el transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: 'rasbiosport@gmail.com',
    pass: 'rasbio1432',
  },
});

// Función para generar el token de verificación
function generateVerificationToken() {
  return crypto.randomBytes(20).toString('hex');
}

// RUTA DE REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, telefono, correo, contraseña, confirmarContraseña } = req.body;

  // Validaciones
  if (!nombre || !telefono || !correo || !contraseña || !confirmarContraseña) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (contraseña !== confirmarContraseña) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM usuari WHERE user_email = $1', [correo]);

    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const verificationToken = generateVerificationToken();

    const mailOptions = {
      from: 'rasbiosport@gmail.com',
      to: correo,
      subject: 'Verificación de registro',
      text: `¡Gracias por registrarte en tu aplicación! Haz clic en el siguiente enlace para verificar tu correo: http://localhost:8080/login/${verificationToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo de verificación:', error);
        return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
      }

      console.log('Correo de verificación enviado:', info.response);
    });

    const nextUserId = await db.one('SELECT nextval(\'user_id_seq\')');
    await db.none('INSERT INTO usuari (id_user, name_user, user_phone, user_email, user_password) VALUES ($1, $2, $3, $4, $5)', [nextUserId.nextval, nombre, telefono, correo, contraseña]);

    res.status(200).json({ message: 'Registro exitoso' });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error en el registro. Inténtalo de nuevo más tarde.' });
  }
});


//LOGIN
const SECRET_KEY = '1243';
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const user = await db.oneOrNone('SELECT * FROM usuari WHERE user_email = $1 AND user_password = $2', [correo, contraseña]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ userId: user.id_user, userEmail: user.user_email }, SECRET_KEY, { expiresIn: '48h' });
    console.log('Token generado:', token);
    return res.json({ message: 'Inicio de sesión exitoso', token });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).json({ error: 'Error en el inicio de sesión. Inténtalo de nuevo más tarde.' });
  }
});


//PERFIL
const authMiddleware = require('../authMiddleware');

router.get('/profile', authMiddleware, (req, res) => {
  try {
      console.log('User Data:', req.user);
      res.json({ message: 'Esta es una ruta protegida', user: req.user });
  } catch (error) {
      console.error('Error al obtener datos del perfil:', error);
      res.status(500).json({ error: 'Error al obtener datos del perfil' });
  }
});



module.exports = router;
