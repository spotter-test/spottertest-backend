const { validationResult } = require('express-validator');
const User = require('../models/user');
const { createSendToken } = require('../utils/jwt');
const { signupValidator, loginValidator } = require('../validators/authValidator');
const bcrypt = require('bcryptjs')

export const signup = async (req, res, next) => {
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

    const newUser = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    createSendToken(newUser, 201, res);

  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    // 1) Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'user does not exist'
      });
    }

    const match = await bcrypt.compare(password,user.password);
    if(match){
        // 4) Generate token and send response
        createSendToken(user, 200, res);
    } else {
        return {
            statusCode: 401,
            message: 'Invalid password'
        }
    }


  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
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


export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
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


export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    const match = await bcrypt.compare(newPassword,user.password)

    // 3) Update password
    user.password = newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);

  } catch (error) {
    next(error);
  }
};


export const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

