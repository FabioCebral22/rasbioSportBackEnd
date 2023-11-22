const express = require('express');
const router = express.Router();
const db = require('../connection');
const jwt = require('jsonwebtoken');
router.get('/products', async (req, res) => {
    try {
      let query = 'SELECT * FROM PRODUCT';
      const params = [];
      const conditions = [];
      
      // Filtrar por categoría
      if (req.query.category_id) {
        conditions.push('category_id = $' + (params.length + 1));
        params.push(req.query.category_id);
      }
  
      // Filtrar por talla
      if (req.query.size) {
        conditions.push('product_size = $' + (params.length + 1));
        params.push(req.query.size);
      }
  
      // Filtrar por rango de precio
      if (req.query.min_price && req.query.max_price) {
        conditions.push('product_price BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2));
        params.push(req.query.min_price);
        params.push(req.query.max_price);
      }
  
      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
  
      const products = await db.any(query, params);
      res.json(products);
    } catch (error) {
      console.error('Error al obtener los productos:', error);
      res.status(500).json({ error: 'Error al obtener los productos' });
    }
  });
  
  const authMiddleware = require('../authMiddleware');
  module.exports = router;