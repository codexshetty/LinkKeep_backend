const express = require('express');
const Link = require('../models/Link');

const router = express.Router();

// @route   GET /s/:shortCode
// @desc    Redirect to original URL
// @access  Public
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const link = await Link.findOne({ shortCode });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Increment click count
    link.clicks += 1;
    await link.save();

    // Redirect to original URL
    res.redirect(link.originalUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
