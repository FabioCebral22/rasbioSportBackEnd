const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const db = require('../connection');

router.post('/order/add', async (req, res) => {
  const { userId, orderAddress, orderTotal, productIds, productos } = req.body;

  try {
    console.log("TUS PRODUCTOS" + JSON.stringify(productos))
    const nextOrderID = await db.one('SELECT nextval(\'order_id_seq\')');
    const prodSizeId = parseInt(nextOrderID.nextval, 10);

    const string = pgp.as.format('INSERT INTO pedido (order_id, user_id, order_address, order_total, order_payment, order_status, order_date, order_discount, order_shipment) VALUES ($1, $2, $3, $4, \'Tarjeta\', \'Pagado\', now(), NULL, \'Envío Normal\')', [prodSizeId, userId, orderAddress, orderTotal]);

    console.log(string);

    const pedido = await db.oneOrNone('INSERT INTO pedido (order_id, user_id, order_address, order_total, order_payment, order_status, order_date, order_discount, order_shipment) VALUES ($1, $2, $3, $4, \'Tarjeta\', \'Pagado\', now(), NULL, \'Envío Normal\')', [prodSizeId, userId, orderAddress, orderTotal]);
    
    console.log("ID DE LOS PRODUCTOS: " + productIds)
    

    const lastProductQuery = 'SELECT MAX(order_id) FROM pedido';
    const result = await db.query(lastProductQuery);
    console.log(result[0].max)
    for (const producto of productos) {
      const { product_id, quantity, size } = producto;
      console.log(product_id)
      console.log(quantity)
      console.log(size)
      await db.none('INSERT INTO order_details (order_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)', [result[0].max, product_id, quantity, size]);
    }


    const scartId = await db.oneOrNone('SELECT scart_id FROM shopping_cart WHERE id_user=$1;', [userId]);
    console.log("SCART ID : " + scartId.scart_id);

      await db.none('DELETE FROM "cart_items" WHERE scart_id=$1;', [scartId.scart_id]);




  } catch (error) {
    console.error('Error al añadir el pedido:', error);
    res.status(500).json({ error: 'Error al añadir el pedido' });
  }
});




//AÑADIR UN PRODUCTO
router.post('/cart/add', async (req, res) => {
  const { userId, productId, size, quantity } = req.body;
  try {
    let cart = await db.oneOrNone('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);

    if (!cart) {
      await db.none('INSERT INTO shopping_cart (id_user, scart_total) VALUES ($1, 0)', [userId]);
      cart = await db.one('SELECT scart_id FROM shopping_cart WHERE id_user = $1', [userId]);
    }

    const existingCartItem = await db.oneOrNone('SELECT * FROM cart_items WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId]);

    if (existingCartItem) {
      await db.none('UPDATE cart_items SET quantity = quantity + $3 WHERE scart_id = $1 AND product_id = $2', [cart.scart_id, productId, quantity]);
    } else {
      await db.none('INSERT INTO cart_items (scart_id, product_id, quantity, size) VALUES ($1, $2, $4, $3)', [cart.scart_id, productId, size, quantity]);
    }

    res.json({ message: 'Producto añadido al carrito' });
  } catch (error) {
    console.error('Error al añadir al carrito:', error);
    res.status(500).json({ error: 'Error al añadir al carrito' });
  }
});

//ELIMINAR TODOS LOS PRODUCTOS
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

//ELIMINAR UN PRODUCTO
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
//GET
router.get('/cart/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const cartItems = await db.any(`
      SELECT p.*, ci.quantity, ci.size FROM cart_items ci
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

