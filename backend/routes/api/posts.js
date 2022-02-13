const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

const auth = require('../../middleware/auth')
const checkObjectId = require('../../middleware/checkObjectId')

const User = require('../../models/User')
const Post = require('../../models/Post')

// @route   POST api/posts
// @desc    Create a Post
// @access  Private
router.post(
  '/',
  auth,
  check('text', 'Text is a required Field').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      })

      const post = await newPost.save()
      res.json(post)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// @route   GET api/posts
// @desc    Get All Post
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 })
    return res.json(posts)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

// @route   GET api/posts/:id
// @desc    Get Post by Id
// @access  Private
router.get('/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: 'Post not Found' })
    }

    res.json(post)
  } catch (err) {
    console.error(err.message)

    return res.status(500).send('Server Error - Get Post by Id')
  }
})

// @route   DELETE api/posts/:id
// @desc    Delete Post by Id
// @access  Private
router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    // Check Post Exists
    if (!post) {
      return res.status(404).json({ msg: 'Post not Found' })
    }
    // Check User is Authorized
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorized' })
    }

    await post.remove()

    res.json({ msg: 'Post Removed' })
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error - Delete Post')
  }
})

// @route   PUT api/posts/like/:id
// @desc    Like a Post
// @access  Private
router.put('/like/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    // Check if Post id already liked
    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post already liked' })
    }

    post.likes.unshift({ user: req.user.id })

    await post.save()

    return res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error - Like Post Failed')
  }
})

// @route   PUT api/posts/like/:id
// @desc    Like a Post
// @access  Private
router.put('/unlike/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    // Check if Post has not been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post is not liked' })
    }

    // Remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    )

    await post.save()

    return res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error - Unlike Post Failed')
  }
})

// @route   PUT api/posts/comment/:id
// @desc    Comment on a Post
// @access  Private
router.put(
  '/comment/:id',
  auth,
  checkObjectId('id'),
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')
      const post = await Post.findById(req.params.id)

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      }

      post.comments.unshift(newComment)
      await post.save()

      res.json(post.comments)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error - Adding Comment')
    }
  }
)

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    )
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' })
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' })
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    )

    await post.save()

    return res.json(post.comments)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

module.exports = router
