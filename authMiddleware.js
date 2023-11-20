const jwt = require('jsonwebtoken');
const SECRET_KEY = '1243';

module.exports = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado. Se requiere autenticación.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('Decoded Token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(401).json({ error: 'Token inválido. Se requiere autenticación.' });
    }
};