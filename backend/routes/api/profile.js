// UPDATE EXPERIENCE 204
// UPDATE EDUCATION 278

const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const checkObjectId = require('../../middleware/checkObjectId')
const axios = require('axios')

const config = require('config')

const { check, validationResult } = require('express-validator')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar'])

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' })
    }

    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',
  auth,
  [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // destructure the request
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body

    // Build Profile Object
    const profileFields = {}
    profileFields.user = req.user.id
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim())
    }

    // Build Social Object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (linkedin) profileFields.social.linkedin = linkedin
    if (twitter) profileFields.social.twitter = twitter
    if (instagram) profileFields.social.instagram = instagram

    try {
      // Using Upsert option (Creates a new DOC if none is found)
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )

      return res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// @route    GET api/profile
// @desc     Get All Profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    return res.json(profiles)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
  '/user/:user_id',
  checkObjectId('user_id'),
  async ({ params: { user_id } }, res) => {
    try {
      const profile = await Profile.findOne({
        user: user_id,
      }).populate('user', ['name', 'avatar'])

      if (!profile) return res.status(400).json({ msg: 'Profile not found' })

      return res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).json({ msg: 'Server error' })
    }
  }
)

// @route    DELETE api/profile
// @desc     Delete a Profile, user and posts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove Users Posts
    // Remove Profile
    // Remove User
    await Profile.findOneAndRemove({ user: req.user.id })
    await User.findOneAndRemove({ user: req.user.id })

    return res.json({ msg: 'User has been deleted' })
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

//////////////
// EXPERIENCE
/////////////

// @route    PUT api/profile/experience
// @desc     Add Profile Experience
// @access   Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From Date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { title, company, location, from, to, current, description } =
      req.body

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id })

      profile.experience.unshift(newExp)
      await profile.save()

      res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// UPDATE EXPERIENCE HERE
////////////////////////

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete Profile Experience
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id })

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    )

    await foundProfile.save()
    return res.json(foundProfile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

////////////
// EDUCATION
////////////
// @route    PUT api/profile/education
// @desc     Add Profile Education
// @access   Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
      check('from', 'From Date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id })

      profile.education.unshift(newEdu)
      await profile.save()

      res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// UPDATE EDUCATION HERE
////////////////////////

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete Profile education
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id })

    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    )

    await foundProfile.save()
    return res.json(foundProfile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// @route    GET api/profile/github/:username
// @desc     Get Github repos
// @access   Public
router.get('/github/:username', async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    )
    const headers = {
      'user-agent': 'node.js',
      Authorization: `token ${config.get('githubToken')}`,
    }

    const gitHubResponse = await axios.get(uri, { headers })
    return res.json(gitHubResponse.data)
  } catch (err) {
    console.error(err.message)
    return res.status(404).json({ msg: 'No Github profile found' })
  }
})

module.exports = router
