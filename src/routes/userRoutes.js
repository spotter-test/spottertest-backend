const express = require('express');
const {
  signup,
  login,
  logout,
  getUser,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middlewares/middleware');
const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout',protect, logout);
router.get('/getuser',protect, getUser);
router.put('/update-profile',protect, updateProfile);
router.put('/change-password',protect, changePassword); 


module.exports = router;