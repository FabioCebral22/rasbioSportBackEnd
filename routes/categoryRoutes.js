const express = require('express');
const router = express.Router();
const db = require('../connection');

router.get('/category', async (req, res) => {
  try {
    const data = await db.any('SELECT * FROM category');
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el nombre de la categoria' });
  }
});

module.exports = router;
