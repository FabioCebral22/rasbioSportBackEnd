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

    res.json(products);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});
//DATOS DE UN PRODUCTO EN CONCRETO
router.get('/products/:product_name', async (req, res) => {
  const { product_name } = req.params;
  console.log(product_name)
  try {
    const newProduct_name = decodeURIComponent(product_name.replace(/\%20/g, ' '));
    console.log(newProduct_name)
    const productDetails = await db.oneOrNone('SELECT * FROM product WHERE product_name = $1', [newProduct_name]);
    if (productDetails) {
      res.json(productDetails);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener detalles del producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//REVIEWS DE UN PRODUCTO
router.get('/products/:product_id/reviews', async (req, res) => {
  const { product_id } = req.params;
  try {
    const reviews = await db.any(`
      SELECT 
        r.review_id,
        r.id_user,
        r.product_id,
        r.review_rating,
        r.review_info,
        r.review_image,
        r.review_date,
        u.name_user as user_name
      FROM review r
      INNER JOIN usuari u ON r.id_user = u.id_user
      WHERE r.product_id = $1
    `, [product_id]);
    res.json(reviews);
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products/search', async (req, res) => {
  const { query } = req.query;
  try {
    const products = await db.any('SELECT * FROM product WHERE LOWER(product_name) LIKE LOWER($1) LIMIT 3', [`%${query}%`]);
    res.json(products);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.get('/products/related/:category_id', async (req, res) => {
  const { category_id } = req.params;
  console.log('CATEGORY ID:' + category_id)
  try {
    const relatedProducts = await db.any('SELECT * FROM product WHERE category_id = $1', [category_id]);
    console.log('RELATED PRODUCTS \n' + relatedProducts)
    res.json(relatedProducts);
  } catch (error) {
    console.error('Error al obtener productos relacionados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


//ELIMINAR PRODUCTO
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.none('DELETE FROM product WHERE product_id = $1', [id]);
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});
//TODOS LOS PRODUCTOS
router.post('/products', async (req, res) => {
  const { product_name, category, product_info, product_image, product_size, product_price, product_tag } = req.body;
  const precio = parseInt(product_price)
  try {
    const categoryResult = await db.oneOrNone('SELECT category_id FROM category WHERE category_name = $1', [JSON.parse(category)]);
    if (categoryResult) {
      const category_id = categoryResult.category_id;
      console.log('Se ha creado el usuario');
      // const nextProductId = await db.one('SELECT nextval(\'product_id_seq\')');
      await db.none('INSERT INTO product (product_id,product_name, category_id,product_info, product_image, product_size, product_price, product_tag) VALUES (nextval(\'product_id_seq\'),$1, $2, $3, $4, $5, $6, $7)', [JSON.parse(product_name), category_id, JSON.parse(product_info), JSON.parse(product_image), JSON.parse(product_size), precio, JSON.parse(product_tag)]);

      res.status(200).json({ message: 'Producto añadido exitosamente' });
    } else {
      console.log('No se encontró ninguna categoría con ese nombre.');
      res.status(400).json({ error: 'Categoría no encontrada' });
    }
  } catch (error) {
    console.error('Error al añadir el producto:', error);
    res.status(500).json({ error: 'Error al añadir el producto' });
  }
});

router.get('/products/search', async (req, res) => {
  const { query } = req.query;
  console.log("La query es " + query);


  
  // try {
  //   const products = await db.any('SELECT * FROM product WHERE LOWER(product_name) LIKE LOWER($1) LIMIT 3', [`%${query}%`]);
  //   console.log("MIERDON", products);
  //   res.json(products);    
  // } catch (error) {
  //   console.error('Error al buscar productos:', error);
  //   res.status(500).json({ error: 'Error interno del servidor' });
  // }
});

router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    category_id,
    product_desc,
    product_info,
    product_image,
    product_size,
    product_price,
    product_tag
  } = req.body;
  try {
    await db.none(
      'UPDATE product SET product_name = $1, category_id = $2, product_desc = $3, product_info = $4, product_image = $5, product_size = $6, product_price = $7, product_tag = $8 WHERE product_id = $9',
      [product_name, category_id, product_desc, product_info, product_image, product_size, product_price, product_tag, id]
    );

    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});


const authMiddleware = require('../authMiddleware');
module.exports = router;
