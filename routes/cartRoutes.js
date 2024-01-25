const express = require('express');
const router = express.Router();
const db = require('../connection');

router.post('/cart/add', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    let cart = await db.oneOrNone('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);

    if (!cart) {
      await db.none('INSERT INTO shopping_cart (id_user, scart_total) VALUES ($1, 0)', [userId]);
      cart = await db.one('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);
    }

    const existingCartItem = await db.oneOrNone('SELECT * FROM cart_items WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);

    if (existingCartItem) {
      await db.none('UPDATE cart_items SET quantity = quantity + 1 WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);
    } else {
      await db.none('INSERT INTO cart_items (scart_id, product_id, quantity) VALUES ($1, $2, 1)', [cart.scart_id, productId]);
    }

    res.json({ message: 'Producto añadido al carrito' });
  } catch (error) {
    console.error('Error al añadir al carrito:', error);
    res.status(500).json({ error: 'Error al añadir al carrito' });
  }
});

router.post('/cart/remove', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await db.one('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);

    if (cart) {
      await db.none('DELETE FROM cart_items WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);

      res.json({ message: 'Producto eliminado del carrito' });
    } else {
      res.status(404).json({ error: 'Carrito no encontrado para el usuario especificado' });
    }
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar producto del carrito' });
  }
});


router.post('/cart/remove-one', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await db.one('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);
    if (cart) {
      const existingCartItem = await db.oneOrNone('SELECT * FROM cart_items WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);

      if (existingCartItem) {
        if (existingCartItem.quantity > 1) {

          await db.none('UPDATE cart_items SET quantity = quantity - 1 WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);
        } else {
          await db.none('DELETE FROM cart_items WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);
        }
        res.json({ message: 'Se quitó 1 unidad del producto del carrito' });
      } else {
        res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
    } else {
      res.status(404).json({ error: 'Carrito no encontrado para el usuario especificado' });
    }
  } catch (error) {
    console.error('Error al quitar 1 unidad del carrito:', error);
    res.status(500).json({ error: 'Error al quitar 1 unidad del carrito' });
  }
});



  
  router.get('/cart/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const cartItems = await db.any(`
        SELECT p.*, ci.quantity FROM cart_items ci
        JOIN product p ON ci.product_id = p.product_id
        JOIN shopping_cart sc ON ci.scart_id = sc.scart_id
        WHERE sc.id_user = $1`, [userId]);
  
      res.json(cartItems);
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      res.status(500).json({ error: 'Error al obtener el carrito' });
    }
  });

  module.exports = router;
  