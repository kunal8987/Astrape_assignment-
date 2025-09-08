const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');
const Item = require('../models/Item');

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate('cart.item');
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  const { itemId, quantity } = req.body;
  if (!itemId) return res.status(400).json({ message: 'Item ID required' });

  try {
    const user = await User.findById(req.user);
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const cartItemIndex = user.cart.findIndex(ci => ci.item.toString() === itemId);
    if (cartItemIndex > -1) {
      // Update quantity
      user.cart[cartItemIndex].quantity += quantity || 1;
    } else {
      user.cart.push({ item: itemId, quantity: quantity || 1 });
    }
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.post('/remove', protect, async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ message: 'Item ID required' });

  try {
    const user = await User.findById(req.user);
    user.cart = user.cart.filter(ci => ci.item.toString() !== itemId);
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
