const { validationResult } = require('express-validator');
const User = require('../models/user');
const { createSendToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs')

const signup = async (req, res, next) => {
  try {
   
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email or username'
      });
    }

    const hashedpassword = await bcrypt.hash(password,10)

    const newUser = await User.create({
      email,
      password: hashedpassword,
      firstName,
      lastName
    });

    createSendToken(newUser, 201, res);

  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'user does not exist' 
      });
    }

    const match = await bcrypt.compare(password,user.password);

    if(match){
        createSendToken(user, 200, res);
    } else {
        return res.status(401).json({ // Fixed: Use res.status().json()
        status: 'error',
        message: 'Invalid password'
      });
    }


  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { password, ...userData } = user;
    
    res.status(200).json({
      status: 'success',
      data: { user: userData }
    });
  } catch (error) {
    next(error);
  }
};


const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true}
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};


const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    const match = await bcrypt.compare(currentPassword,user.password);

    if(match){
        const hashedpassword = await bcrypt.hash(newPassword,10);
    
        // 3) Update password
        user.password = hashedpassword;
        await user.save();

        return res.status(200).json({
          status: 'success',
          message: 'password updated successfully'
        })
    } else {
        return res.status(401).json({ 
        status: 'error',
        message: 'Current password is incorrect'
      });
    }


    // 4) Log user in, send JWT
    createSendToken(user, 200, res);

  } catch (error) {
    next(error);
  }
};


const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

module.exports = {
    signup,
    login,
    changePassword,
    updateProfile,
    getUser,
    logout
}

