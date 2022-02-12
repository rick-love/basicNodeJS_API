const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')

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
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    try {
      // Check for User
      let user = await User.findOne({ email })
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] })
      }

      // Get User gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      })

      user = new User({
        name,
        email,
        password,
        avatar,
      })

      // Encrypt Password
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)

      //   Save User to DB
      await user.save()

      // Return jsonWebToken
      const payload = {
        user: {
          id: user.id,
        },
      }
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) {
            throw err
          }
          res.json({ token })
        }
      )

      //   Catch Errors
    } catch (error) {
      console.error('Database error: ' + error.message)
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
