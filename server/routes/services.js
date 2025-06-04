const express = require('express');
const { Service } = require('../models'); // Adjusted path
const { protect, isOwner, isStaff } = require('../middleware/authMiddleware'); // Adjusted path

const router = express.Router();

// POST /api/services - Create a new service (Owner only)
router.post('/', protect, isOwner, async (req, res) => {
  const { name, description, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price, and category are required.' });
  }

  // Validate category
  const validCategories = ['basic_wash', 'premium_wash', 'detailing_services', 'additional_services', 'package_deals'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid service category.' });
  }

  try {
    const newService = new Service({
      name,
      description,
      price,
      category
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error creating service.', error: error.message });
  }
});

// GET /api/services - Retrieve all services (Staff and Owner)
router.get('/', protect, isStaff, async (req, res) => { // isStaff allows both staff and owner
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error fetching services.', error: error.message });
  }
});

// GET /api/services/:id - Retrieve a single service by ID (Staff and Owner)
router.get('/:id', protect, isStaff, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID format.' });
    }
    res.status(500).json({ message: 'Server error fetching service.', error: error.message });
  }
});

// PUT /api/services/:id - Update an existing service (Owner only)
router.put('/:id', protect, isOwner, async (req, res) => {
  const { name, description, price, category } = req.body;

  // Basic validation
  if (!name && !description && price === undefined && !category) {
    return res.status(400).json({ message: 'At least one field must be provided for update.' });
  }
  if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
    return res.status(400).json({ message: 'Price must be a non-negative number.' });
  }
  if (category) {
    const validCategories = ['basic_wash', 'premium_wash', 'detailing_services', 'additional_services', 'package_deals'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid service category.' });
    }
  }

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // Update fields if they are provided
    if (name) service.name = name;
    if (description) service.description = description;
    if (price !== undefined) service.price = parseFloat(price);
    if (category) service.category = category;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID format.' });
    }
    res.status(500).json({ message: 'Server error updating service.', error: error.message });
  }
});

// DELETE /api/services/:id - Delete a service (Owner only)
router.delete('/:id', protect, isOwner, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    res.json({ message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Error deleting service:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID format.' });
    }
    res.status(500).json({ message: 'Server error deleting service.', error: error.message });
  }
});

module.exports = router;
