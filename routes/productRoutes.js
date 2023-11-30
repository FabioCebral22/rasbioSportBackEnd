const express = require('express');
const router = express.Router();
const db = require('../connection');
const jwt = require('jsonwebtoken');


router.get('/products', async (req, res) => {
  try {
    let query = `
      SELECT * FROM product
      JOIN category ON product.category_id = category.category_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.category_name) {
      conditions.push('category.category_name = $' + (params.length + 1));
      params.push(req.query.category_name);
    }

    if (req.query.size) {
      conditions.push('product_size = $' + (params.length + 1));
      params.push(req.query.size);
    }

    if (req.query.min_price && req.query.max_price) {
      conditions.push('product_price BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2));
      params.push(req.query.min_price);
      params.push(req.query.max_price);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('Query SQL:', query);
    console.log('Parámetros:', params);

    const products = await db.any(query, params);
    console.log('Productos encontrados:', products);

    res.json(products);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

//AÑADIR PRODUCTO
router.post('/addProduct', async (req, res) => {
  const { nombreProducto, categoriaProducto, infoProducto, contraseña, imgProducto, tagProducto, tallaProducto } = req.body;

  if (!nombreProducto || !categoriaProducto || !infoProducto || !contraseña || !imgProducto || !tagProducto || !tallaProducto) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const categoryIdResult = await db.one('SELECT category_id FROM category WHERE category_name = $1', [categoriaProducto]);

    const nextProductId = await db.one('SELECT nextval(\'product_id_seq\')');
    await db.none('INSERT INTO product (product_name, category_id, product_desc, product_info, product_image, product_size, product_prize, product_tag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [nombreProducto, categoryIdResult.category_id, null, infoProducto, imgProducto, tallaProducto, null, tagProducto]);

    res.status(200).json({ message: 'Registro exitoso' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});



const authMiddleware = require('../authMiddleware');
module.exports = router;
