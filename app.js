const express = require('express');
const app = express();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); 
const productRoutes = require('./routes/productRoutes')
const categoryRoutes = require('./routes/categoryRoutes')


app.use(cors());
app.use(express.json());


app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});