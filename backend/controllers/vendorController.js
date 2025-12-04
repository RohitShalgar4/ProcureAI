import Vendor from '../models/Vendor.js';
import { ValidationError, DuplicateError, NotFoundError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new vendor
 * POST /api/vendors
 */
export const createVendor = asyncHandler(async (req, res) => {
  const { name, email, contact_person, phone, specialization, notes } = req.body;

  // Validate required fields
  if (!name || !email) {
    const details = {};
    if (!name) details.name = 'Name is required';
    if (!email) details.email = 'Email is required';
    throw new ValidationError('Missing required fields', details);
  }

  // Check for duplicate email
  const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
  if (existingVendor) {
    throw new DuplicateError('Vendor with this email already exists', {
      email: email,
      existingVendorId: existingVendor._id,
    });
  }

  // Create new vendor
  const vendor = new Vendor({
    name,
    email,
    contact_person,
    phone,
    specialization,
    notes,
  });

  await vendor.save();

  res.status(201).json({
    message: 'Vendor created successfully',
    vendor: {
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      specialization: vendor.specialization,
      notes: vendor.notes,
      created_at: vendor.created_at,
      updated_at: vendor.updated_at,
    },
  });
});

/**
 * Get all vendors
 * GET /api/vendors
 */
export const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().sort({ created_at: -1 });

  res.status(200).json({
    count: vendors.length,
    vendors: vendors.map(v => ({
      id: v._id,
      name: v.name,
      email: v.email,
      contact_person: v.contact_person,
      phone: v.phone,
      specialization: v.specialization,
      notes: v.notes,
      created_at: v.created_at,
      updated_at: v.updated_at,
    })),
  });
});

/**
 * Update a vendor
 * PUT /api/vendors/:id
 */
export const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, contact_person, phone, specialization, notes } = req.body;

  // Find vendor
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }

  // Check for duplicate email if email is being changed
  if (email && email.toLowerCase() !== vendor.email) {
    const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (existingVendor) {
      throw new DuplicateError('Another vendor with this email already exists', {
        email: email,
        existingVendorId: existingVendor._id,
      });
    }
  }

  // Update fields
  if (name !== undefined) vendor.name = name;
  if (email !== undefined) vendor.email = email;
  if (contact_person !== undefined) vendor.contact_person = contact_person;
  if (phone !== undefined) vendor.phone = phone;
  if (specialization !== undefined) vendor.specialization = specialization;
  if (notes !== undefined) vendor.notes = notes;

  await vendor.save();

  res.status(200).json({
    message: 'Vendor updated successfully',
    vendor: {
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      specialization: vendor.specialization,
      notes: vendor.notes,
      created_at: vendor.created_at,
      updated_at: vendor.updated_at,
    },
  });
});

/**
 * Delete a vendor
 * DELETE /api/vendors/:id
 */
export const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find and delete vendor
  const vendor = await Vendor.findByIdAndDelete(id);

  if (!vendor) {
    throw new NotFoundError('Vendor');
  }

  res.status(200).json({
    message: 'Vendor deleted successfully',
    vendor: {
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
    },
  });
});
