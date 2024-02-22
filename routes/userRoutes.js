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

router.put('/change-password', authMiddleware, async (req, res) => {
  const { id_user, new_password } = req.body;

  try {
    // Actualiza la contraseña en la base de datos
    await db.none('UPDATE usuari SET user_password = $1 WHERE id_user = $2', [new_password, id_user]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    res.status(500).json({ error: 'Error al actualizar la contraseña. Inténtalo de nuevo más tarde.' });
  }
});

router.post('/verify-password', authMiddleware, async (req, res) => {
  const { id_user, current_password } = req.body;

  try {
    // Obtener la contraseña actual del usuario desde la base de datos
    const user = await db.one('SELECT user_password FROM usuari WHERE id_user = $1', [id_user]);

    // Comparar la contraseña proporcionada con la almacenada en la base de datos
    const isPasswordCorrect = current_password === user.user_password;

    res.json({ isPasswordCorrect });
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
    res.status(500).json({ error: 'Error al verificar la contraseña. Inténtalo de nuevo más tarde.' });
  }
});


router.get('/user-orders/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  try {
    const orders = await db.any(`
      SELECT o.order_id, o.order_date, o.order_total, od.product_id, od.quantity, p.product_name, p.product_price, p.product_image
      FROM "ORDER"
      JOIN ORDER_DETAIL od ON o.order_id = od.order_id
      JOIN PRODUCT p ON od.product_id = p.product_id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `, [userId]);

    // Agrupar por orderId para estructurar los datos de manera coherente para el front
    const groupedOrders = orders.reduce((acc, order) => {
      // Si el pedido ya esta en el acumulador, agrega el producto actual a su lista
      if (!acc[order.order_id]) {
        acc[order.order_id] = {
          order_id: order.order_id,
          order_date: order.order_date,
          order_total: order.order_total,
          products: []
        }
      }
      acc[order.order_id].products.push({
        product_id: order.product_id,
        quantity: order.quantity,
        product_name: order.product_name,
        product_price: order.product_price,
        product_image: order.product_image
      });
      return acc;
    }, {});

    // Convertir el objeto agrupado en un array de objetos de pedidos
    const ordersArray = Object.values(groupedOrders);

    res.json(ordersArray);
  } catch (error) {
    console.error('Error al obtener los pedidos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RUTA DE REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, telefono, correo, contraseña, confirmarContraseña, direccion } = req.body;

  // Validaciones
  if (!nombre || !telefono || !correo || !contraseña || !confirmarContraseña || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (contraseña !== confirmarContraseña) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  // Validación de la contraseña
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
  if (!passwordRegex.test(contraseña)) {
    return res.status(400).json({ error: 'La contraseña no cumple con los requisitos mínimos' });
  }

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM usuari WHERE user_email = $1', [correo]);

    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Obtén el próximo valor de la secuencia para id_user y scart_id
    const nextIds = await db.one('SELECT nextval(\'id_user_seq\') AS next_user, nextval(\'scart_id_seq\') AS next_cart');
    
    // Inserta en usuari y shopping_cart con los valores generados
    await db.none('INSERT INTO usuari (id_user, name_user, user_phone, user_email, user_password, user_address) VALUES ($1, $2, $3, $4, $5, $6)', [nextIds.next_user, nombre, telefono, correo, contraseña, direccion]);

    await db.none('INSERT INTO shopping_cart (scart_id, id_user, scart_total) VALUES ($1, $2, 0)', [nextIds.next_cart, nextIds.next_user]);

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
