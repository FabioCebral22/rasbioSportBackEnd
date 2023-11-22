const express = require('express');
const app = express();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); 
const productRoutes = require('./routes/productRoutes')
app.use(cors());
app.use(express.json());

app.use('/api', userRoutes); 
app.use('/api', productRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});