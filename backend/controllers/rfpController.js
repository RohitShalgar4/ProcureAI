import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import Proposal from '../models/Proposal.js';
import AIService from '../services/AIService.js';
import EmailService from '../services/EmailService.js';
import { ValidationError, NotFoundError, AIServiceError, EmailServiceError, asyncHandler } from '../middleware/errorHandler.js';

// Initialize services
const aiService = new AIService();
const emailService = new EmailService();

/**
 * Create new RFP from natural language description
 * POST /api/rfps
 */
export const createRFP = asyncHandler(async (req, res) => {
  const { description, budget, deadline } = req.body;

  // Validate required fields
  if (!description || description.trim().length === 0) {
    throw new ValidationError('Missing required field', {
      description: 'Description is required',
    });
  }

  // Call AI service to structure the RFP
  let structuredData;
  try {
    structuredData = await aiService.structureRFP(description);
  } catch (aiError) {
    console.error('AI service error:', aiError);
    throw new AIServiceError('Failed to structure RFP using AI', aiError.message);
  }

  // Create RFP with structured data
  const rfp = new RFP({
    title: structuredData.title,
    description: description,
    structured_data: structuredData,
    budget: budget || structuredData.budget,
    deadline: deadline || null,
    status: 'draft',
  });

  await rfp.save();

  res.status(201).json({
    message: 'RFP created successfully',
    rfp: {
      id: rfp._id,
      title: rfp.title,
      description: rfp.description,
      structured_data: rfp.structured_data,
      budget: rfp.budget,
      deadline: rfp.deadline,
      status: rfp.status,
      created_at: rfp.created_at,
      updated_at: rfp.updated_at,
    },
  });
});

/**
 * Get all RFPs
 * GET /api/rfps
 */
export const getAllRFPs = asyncHandler(async (req, res) => {
  const rfps = await RFP.find().sort({ created_at: -1 });

  // Get proposal counts for each RFP
  const rfpsWithCounts = await Promise.all(
    rfps.map(async (rfp) => {
      const proposalCount = await Proposal.countDocuments({ rfp_id: rfp._id });
      
      return {
        id: rfp._id,
        title: rfp.title,
        description: rfp.description,
        status: rfp.status,
        budget: rfp.budget,
        deadline: rfp.deadline,
        created_at: rfp.created_at,
        updated_at: rfp.updated_at,
        proposal_count: proposalCount,
        vendor_count: rfp.vendors?.length || 0,
      };
    })
  );

  res.status(200).json({
    count: rfpsWithCounts.length,
    rfps: rfpsWithCounts,
  });
});

/**
 * Get detailed RFP by ID
 * GET /api/rfps/:id
 */
export const getRFPById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rfp = await RFP.findById(id).populate('vendors.vendor_id', 'name email specialization');

  if (!rfp) {
    throw new NotFoundError('RFP');
  }

  // Get proposal count
  const proposalCount = await Proposal.countDocuments({ rfp_id: rfp._id });

  res.status(200).json({
    rfp: {
      id: rfp._id,
      title: rfp.title,
      description: rfp.description,
      structured_data: rfp.structured_data,
      budget: rfp.budget,
      deadline: rfp.deadline,
      status: rfp.status,
      vendors: rfp.vendors.map(v => ({
        vendor_id: v.vendor_id?._id,
        name: v.vendor_id?.name,
        email: v.vendor_id?.email,
        specialization: v.vendor_id?.specialization,
        sent_at: v.sent_at,
      })),
      created_at: rfp.created_at,
      updated_at: rfp.updated_at,
      proposal_count: proposalCount,
    },
  });
});

/**
 * Send RFP to selected vendors
 * POST /api/rfps/:id/send
 */
export const sendRFP = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vendor_ids } = req.body;

  // Validate vendor_ids
  if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
    throw new ValidationError('Missing required field', {
      vendor_ids: 'vendor_ids must be a non-empty array',
    });
  }

  // Find RFP
  const rfp = await RFP.findById(id);
  if (!rfp) {
    throw new NotFoundError('RFP');
  }

  // Fetch vendor details
  const vendors = await Vendor.find({ _id: { $in: vendor_ids } });

  if (vendors.length === 0) {
    throw new NotFoundError('No valid vendors found with provided IDs');
  }

  if (vendors.length !== vendor_ids.length) {
    console.warn(`Some vendor IDs were not found. Requested: ${vendor_ids.length}, Found: ${vendors.length}`);
  }

  // Send RFP to vendors via email
  let emailResults;
  try {
    emailResults = await emailService.sendRFPToVendors(rfp, vendors);
  } catch (emailError) {
    console.error('Email service error:', emailError);
    throw new EmailServiceError('Failed to send RFP emails', emailError.message);
  }

  // Update RFP with vendor send information
  const sentAt = new Date();
  const vendorEntries = emailResults.successful.map(result => ({
    vendor_id: result.vendorId,
    sent_at: sentAt,
  }));

  // Add new vendors to the RFP (avoid duplicates)
  vendorEntries.forEach(entry => {
    const existingIndex = rfp.vendors.findIndex(
      v => v.vendor_id.toString() === entry.vendor_id.toString()
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      rfp.vendors[existingIndex].sent_at = entry.sent_at;
    } else {
      // Add new entry
      rfp.vendors.push(entry);
    }
  });

  // Update RFP status
  if (rfp.status === 'draft') {
    rfp.status = 'sent';
  }

  await rfp.save();

  res.status(200).json({
    message: 'RFP sent successfully',
    results: {
      total: emailResults.total,
      successful: emailResults.successful.length,
      failed: emailResults.failed.length,
      sent_to: emailResults.successful.map(r => ({
        vendor_id: r.vendorId,
        vendor_name: r.vendorName,
        email: r.email,
      })),
      failed_vendors: emailResults.failed.map(r => ({
        vendor_id: r.vendorId,
        vendor_name: r.vendorName,
        email: r.email,
      })),
      errors: emailResults.errors,
    },
    rfp: {
      id: rfp._id,
      status: rfp.status,
      vendors_count: rfp.vendors.length,
    },
  });
});
