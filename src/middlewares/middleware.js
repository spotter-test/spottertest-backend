const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');


const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return {
        statusCode: 401,
        message: 'You are not logged in , login to continue'
      };
    }

   
    const decoded = verifyToken(token);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return {
        statusCode: 401,
        message: 'user does not exists'
      };
    }

    req.user = currentUser;
    next();

  } catch (error) {
    return {
        statusCode : 401,
        message: 'Inavlid token , login again'
    };
  }
};

module.exports = {
  protect
};