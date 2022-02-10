const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 Characters').isLength({
      min: 8,
    }),
  ],
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    

    // Check for User
    // Get User gravatar
    // Encrypt Password
    // Return jsonWebToken

    res.send('User Route')
  }
)

module.exports = router
