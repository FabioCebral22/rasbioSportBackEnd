const express = require('express');
const router = express.Router();
const db = require('../connection');

router.post('/cart/add', async (req, res) => {
    const { userId, productId } = req.body;
  
    try {
      // Primero, encuentra o crea un carrito para el usuario
      let cart = await db.oneOrNone('SELECT scart_id FROM shopping_cart WHERE user_id = $1', [userId]);
      if (!cart) {
        await db.none('INSERT INTO shopping_cart (user_id, scart_total) VALUES ($1, 0)', [userId]);
        cart = await db.one('SELECT scart_id FROM shopping_cart WHERE user_id = $1', [userId]);
      }
  
      // Luego, añade el producto al carrito
      await db.none('INSERT INTO cart_items (scart_id, product_id, quantity) VALUES ($1, $2, 1)', [cart.scart_id, productId]);
  
      res.json({ message: 'Producto añadido al carrito' });
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      res.status(500).json({ error: 'Error al añadir al carrito' });
    }
  });
  
  router.get('/cart/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const cartItems = await db.any(`
        SELECT p.*, ci.quantity FROM cart_items ci
        JOIN product p ON ci.product_id = p.product_id
        JOIN shopping_cart sc ON ci.scart_id = sc.scart_id
        WHERE sc.user_id = $1`, [userId]);
  
      res.json(cartItems);
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      res.status(500).json({ error: 'Error al obtener el carrito' });
    }
  });

  module.exports = router;
  