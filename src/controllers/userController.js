const { validationResult } = require('express-validator');
const User = require('../models/user');
const { createSendToken } = require('../utils/jwt');
const { signupValidator, loginValidator } = require('../validators/authValidator');

export const signup = async (req, res, next) => {
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

    const { email, password, firstName, lastName } = req.body;

    // 2) Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email or username'
      });
    }

    // 3) Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // 4) Generate token and send response
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

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // 4) Generate token and send response
    createSendToken(user, 200, res);

  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email } = req.body;
    
    // Check if username or email already exists (excluding current user)
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user.id }
      });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already taken'
        });
      }
    }

    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id }
      });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already taken'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, username, email },
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

    // 2) Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is wrong'
      });
    }

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

