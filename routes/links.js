const express = require('express');
const { body, validationResult } = require('express-validator');
const Link = require('../models/Link');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate random short code
const generateShortCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @route   POST /api/links
// @desc    Create a new link
// @access  Private
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Link name is required'),
  body('originalUrl').isURL().withMessage('Please enter a valid URL'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, originalUrl, description } = req.body;

    // Generate unique short code
    let shortCode;
    let isUnique = false;
    while (!isUnique) {
      shortCode = generateShortCode();
      const existingLink = await Link.findOne({ shortCode });
      if (!existingLink) {
        isUnique = true;
      }
    }

    const link = new Link({
      name,
      originalUrl,
      shortCode,
      description,
      userId: req.user._id
    });

    await link.save();

    res.status(201).json({
      message: 'Link created successfully',
      link: {
        id: link._id,
        name: link.name,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`,
        description: link.description,
        clicks: link.clicks,
        createdAt: link.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/links
// @desc    Get all links for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    const formattedLinks = links.map(link => ({
      id: link._id,
      name: link.name,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`,
      description: link.description,
      clicks: link.clicks,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    }));

    res.json({ links: formattedLinks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/links/:id
// @desc    Get a specific link
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({
      link: {
        id: link._id,
        name: link.name,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`,
        description: link.description,
        clicks: link.clicks,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/links/:id
// @desc    Update a link
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Link name cannot be empty'),
  body('originalUrl').optional().isURL().withMessage('Please enter a valid URL'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, originalUrl, description } = req.body;
    
    const link = await Link.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Update fields
    if (name !== undefined) link.name = name;
    if (originalUrl !== undefined) link.originalUrl = originalUrl;
    if (description !== undefined) link.description = description;

    await link.save();

    res.json({
      message: 'Link updated successfully',
      link: {
        id: link._id,
        name: link.name,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`,
        description: link.description,
        clicks: link.clicks,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/links/:id
// @desc    Delete a link
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    await Link.findByIdAndDelete(req.params.id);

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
