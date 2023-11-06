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
});

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
