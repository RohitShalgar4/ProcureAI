import express from 'express';
import {
  receiveProposal,
} from '../controllers/proposalController.js';

const router = express.Router();

/**
 * POST /api/proposals/inbound
 * Receive vendor email responses (webhook or manual trigger)
 */
router.post('/inbound', receiveProposal);

export default router;
