const express = require('express');
const router = express.Router();
const db = require('../connection');
const jwt = require('jsonwebtoken');

router.get('/users', async (req, res) => {
  try {
    const data = await db.any('SELECT * FROM usuari');
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos de usuarios' });
  }
});

router.post('/register', async (req, res) => {
  const { nombre, telefono, correo, contraseña, confirmarContraseña } = req.body;

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
  } catch (error) {
    console.error('Hola Error en el registro:', error);
    res.status(500).json({ error: 'Error en el registro. Inténtalo de nuevo más tarde.' });
  }

  try{
    const nextUserId = await db.one('SELECT nextval(\'user_id_seq\')');
    
    await db.none('INSERT INTO usuari (id_user, name_user, user_phone, user_email, user_password) VALUES ($1, $2, $3, $4, $5)', [nextUserId.nextval, nombre, telefono, correo, contraseña]);

    res.status(200).json({ message: 'Registro exitoso' });
  } catch(error){
    console.log('Prueba')
  }

  }


);



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
  
  
      res.json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      res.status(500).json({ error: 'Error en el inicio de sesión. Inténtalo de nuevo más tarde.' });
    }
  });



module.exports = router;
