//Create web server
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
//Include Post and Comment models
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
//Include auth middleware
const auth = require('../../middleware/auth');

// @route   POST api/comments
// @desc    Create a comment
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Comment text is required')
        .not()
        .isEmpty(),
      check('post', 'Post ID is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    //Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //Return error messages
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //Get post
      const post = await Post.findById(req.body.post);
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      //Create comment
      const comment = new Comment({
        text: req.body.text,
        user: req.user.id,
        post: req.body.post
      });

      //Save comment
      await comment.save();

      //Add comment to post
      post.comments.unshift(comment.id);
      await post.save();

      //Return comment
      res.json(comment);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/comments/:id
// @desc    Get comment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    //Get comment
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    //Return comment
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/comments/:id
// @desc    Update comment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    //Get comment
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    //Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    //Update comment
    comment.text = req.body.text;
    await comment.save();

    //Return comment
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
