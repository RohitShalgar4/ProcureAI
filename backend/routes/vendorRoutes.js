import express from 'express';
import {
  createVendor,
  getAllVendors,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController.js';

const router = express.Router();

/**
 * POST /api/vendors
 * Create a new vendor
 */
router.post('/', createVendor);

/**
 * GET /api/vendors
 * Get all vendors
 */
router.get('/', getAllVendors);

/**
 * PUT /api/vendors/:id
 * Update a vendor
 */
router.put('/:id', updateVendor);

/**
 * DELETE /api/vendors/:id
 * Delete a vendor
 */
router.delete('/:id', deleteVendor);

export default router;
