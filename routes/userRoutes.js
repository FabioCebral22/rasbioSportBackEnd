const express = require('express');
const router = express.Router();
const db = require('../connection');
const jwt = require('jsonwebtoken');
const User = require('../classes/userClass');
const authMiddleware = require('../authMiddleware');


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
    const userData = await db.oneOrNone('SELECT * FROM usuari WHERE user_email = $1 AND user_password = $2', [correo, contraseña]);

    if (!userData) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = new User(userData);
    console.log(user)

    const token = jwt.sign({ userId: user.id, userEmail: user.email }, SECRET_KEY, { expiresIn: '48h' });
    res.json({user,
      token
    });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión. Inténtalo de nuevo más tarde.' });
  }
});


//PERFIL


router.get('/profile', authMiddleware, (req, res) => {
  try {
      console.log('User Data:', req.user);
      res.json( { message: 'Esta es una ruta protegida', user: req.user } );
  } catch (error) {
      console.error('Error al obtener datos del perfil:', error);
      res.status(500).json({ error: 'Error al obtener datos del perfil' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  const { id_user, field, value} = req.body
  const userID = parseInt(id_user);
  const nameField = JSON.parse(field)
  const newValue = JSON.parse(value)
  try {
    const user = await db.oneOrNone("UPDATE usuari SET $1~ = $2 WHERE id_user = $3;", [nameField, newValue, userID]);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



module.exports = router;
