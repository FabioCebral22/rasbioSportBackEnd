const express = require('express');
const app = express();
const db = require('./connection');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/userRoutes'); 

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
