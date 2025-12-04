import express from 'express';
import {
  createRFP,
  getAllRFPs,
  getRFPById,
  sendRFP,
} from '../controllers/rfpController.js';
import {
  getProposalsByRFP,
  getComparison,
} from '../controllers/proposalController.js';

const router = express.Router();

/**
 * POST /api/rfps
 * Create a new RFP from natural language description
 */
router.post('/', createRFP);

/**
 * GET /api/rfps
 * Get all RFPs
 */
router.get('/', getAllRFPs);

/**
 * GET /api/rfps/:id
 * Get detailed RFP by ID
 */
router.get('/:id', getRFPById);

/**
 * POST /api/rfps/:id/send
 * Send RFP to selected vendors
 */
router.post('/:id/send', sendRFP);

/**
 * GET /api/rfps/:id/proposals
 * Get all proposals for a specific RFP
 */
router.get('/:id/proposals', getProposalsByRFP);

/**
 * GET /api/rfps/:id/comparison
 * Get AI comparison and recommendation for proposals
 */
router.get('/:id/comparison', getComparison);

export default router;
