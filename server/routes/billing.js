const express = require('express');
const { Billing, Service, User } = require('../models'); // Adjusted path
const { protect, isOwner, isStaff } = require('../middleware/authMiddleware'); // Adjusted path

const router = express.Router();

// POST /api/billing - Create a new billing record (Staff or Owner)
router.post('/', protect, isStaff, async (req, res) => {
  const { customerName, carDetails, serviceIds, totalAmount } = req.body;
  const staffMember = req.user.id; // From JWT payload via 'protect' middleware

  if (!customerName || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0 || totalAmount === undefined) {
    return res.status(400).json({ message: 'Customer name, service IDs (array), and total amount are required.' });
  }
  if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0) {
    return res.status(400).json({ message: 'Total amount must be a non-negative number.' });
  }

  try {
    // Optional: Verify serviceIds are valid and calculate/verify totalAmount on backend
    let calculatedPrice = 0;
    const services = await Service.find({ '_id': { $in: serviceIds } });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: 'One or more service IDs are invalid.' });
    }
    services.forEach(service => calculatedPrice += service.price);

    // Could add a tolerance check for totalAmount vs calculatedPrice if needed
    // For now, we'll trust the client's totalAmount but log if different significantly
    if (Math.abs(calculatedPrice - parseFloat(totalAmount)) > 0.01) { // Tolerance for floating point
        console.warn(`Price mismatch for new bill: client ${totalAmount}, server ${calculatedPrice}. Using client total for now.`);
        // Potentially, override client total: totalAmount = calculatedPrice;
    }


    const newBilling = new Billing({
      customerName,
      carDetails: carDetails || '', // Optional field
      services: serviceIds,
      totalAmount: parseFloat(totalAmount),
      staffMember,
      paymentStatus: 'pending', // Default payment status
    });

    const savedBilling = await newBilling.save();
    // Populate services and staffMember for the response
    const populatedBilling = await Billing.findById(savedBilling._id)
        .populate('services', 'name price category')
        .populate('staffMember', 'username role');

    res.status(201).json(populatedBilling);
  } catch (error) {
    console.error('Error creating billing record:', error);
    res.status(500).json({ message: 'Server error creating billing record.', error: error.message });
  }
});

// GET /api/billing - Retrieve billing records (All for Owner, own for Staff)
router.get('/', protect, isStaff, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'staff') {
      query.staffMember = req.user.id;
    }
    // Sort by newest first
    const billingRecords = await Billing.find(query)
      .populate('services', 'name price') // Populate service details
      .populate('staffMember', 'username') // Populate staff member username
      .sort({ createdAt: -1 });
    res.json(billingRecords);
  } catch (error) {
    console.error('Error fetching billing records:', error);
    res.status(500).json({ message: 'Server error fetching billing records.', error: error.message });
  }
});

// GET /api/billing/:id - Retrieve a single billing record by ID (Staff or Owner)
router.get('/:id', protect, isStaff, async (req, res) => {
  try {
    const billingRecord = await Billing.findById(req.params.id)
      .populate('services', 'name price description category')
      .populate('staffMember', 'username role');

    if (!billingRecord) {
      return res.status(404).json({ message: 'Billing record not found.' });
    }

    // If user is staff, ensure they are the one who created it or an owner
    if (req.user.role === 'staff' && billingRecord.staffMember._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this billing record.' });
    }

    res.json(billingRecord);
  } catch (error) {
    console.error('Error fetching billing record by ID:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid billing ID format.' });
    }
    res.status(500).json({ message: 'Server error fetching billing record.', error: error.message });
  }
});

// PUT /api/billing/:id - Update a billing record (Owner only)
// For general updates like payment status, notes, or minor corrections.
// Service items or major amount changes might go through 'requestChange' flow.
router.put('/:id', protect, isOwner, async (req, res) => {
  const { customerName, carDetails, paymentStatus, totalAmount } = req.body;
  // Service IDs are generally not updated here directly to maintain record integrity.
  // If service items need change, it's often better to cancel and recreate or use a specific adjustment process.

  try {
    const billingRecord = await Billing.findById(req.params.id);
    if (!billingRecord) {
      return res.status(404).json({ message: 'Billing record not found.' });
    }

    // Update fields if provided
    if (customerName) billingRecord.customerName = customerName;
    if (carDetails) billingRecord.carDetails = carDetails;
    if (paymentStatus && ['pending', 'paid', 'cancelled'].includes(paymentStatus)) {
        billingRecord.paymentStatus = paymentStatus;
    } else if (paymentStatus) {
        return res.status(400).json({ message: 'Invalid payment status.' });
    }
    // Owner might directly adjust totalAmount if necessary, e.g. manual discount not part of 'requestChange'
    if (totalAmount !== undefined) {
        const newTotal = parseFloat(totalAmount);
        if (isNaN(newTotal) || newTotal < 0) {
            return res.status(400).json({ message: 'Invalid total amount.' });
        }
        billingRecord.totalAmount = newTotal;
    }

    // Note: If services array needs to be updated, handle with care.
    // For simplicity, this basic PUT doesn't modify the services array.

    const updatedBillingRecord = await billingRecord.save();
    const populatedRecord = await Billing.findById(updatedBillingRecord._id)
        .populate('services', 'name price')
        .populate('staffMember', 'username');
    res.json(populatedRecord);
  } catch (error) {
    console.error('Error updating billing record:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid billing ID format.' });
    }
    res.status(500).json({ message: 'Server error updating billing record.', error: error.message });
  }
});

// DELETE /api/billing/:id - Delete a billing record (Owner only)
router.delete('/:id', protect, isOwner, async (req, res) => {
  try {
    const billingRecord = await Billing.findByIdAndDelete(req.params.id);
    if (!billingRecord) {
      return res.status(404).json({ message: 'Billing record not found.' });
    }
    res.json({ message: 'Billing record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting billing record:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid billing ID format.' });
    }
    res.status(500).json({ message: 'Server error deleting billing record.', error: error.message });
  }
});

module.exports = router;
