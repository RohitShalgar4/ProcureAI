import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import EmailService from '../services/EmailService.js';
import AIService from '../services/AIService.js';
import { ValidationError, NotFoundError, DuplicateError, AIServiceError, asyncHandler } from '../middleware/errorHandler.js';

const emailService = new EmailService();
const aiService = new AIService();

/**
 * Process inbound email and create proposal
 * POST /api/proposals/inbound
 */
export const receiveProposal = asyncHandler(async (req, res) => {
  const { from, subject, body, html, attachments } = req.body;

  if (!from || !subject || !body) {
    throw new ValidationError('Missing required fields: from, subject, body');
  }

  // Extract email data
  const emailData = {
    from,
    subject,
    body,
    html,
    attachments: attachments || [],
  };

  // Correlate email to RFP and Vendor
  const correlation = await emailService.correlateEmailToRFP(
    emailData,
    async (vendorId) => {
      // Find most recent RFP sent to this vendor
      return await RFP.findOne({
        'vendors.vendor_id': vendorId,
        status: { $in: ['sent', 'receiving_proposals'] },
      }).sort({ 'vendors.sent_at': -1 });
    },
    async (email) => {
      // Find vendor by email
      return await Vendor.findOne({ email: email.toLowerCase() });
    }
  );

  if (!correlation.success || !correlation.rfpId || !correlation.vendorId) {
    throw new ValidationError('Unable to correlate email to RFP and vendor', {
      rfpId: correlation.rfpId,
      vendorId: correlation.vendorId,
      fromEmail: correlation.fromEmail,
    });
  }

  // Check if proposal already exists
  const existingProposal = await Proposal.findOne({
    rfp_id: correlation.rfpId,
    vendor_id: correlation.vendorId,
  });

  if (existingProposal) {
    throw new DuplicateError('Proposal from this vendor for this RFP already exists', {
      proposalId: existingProposal._id,
    });
  }

  // Create proposal record with raw email content
  const proposal = new Proposal({
    rfp_id: correlation.rfpId,
    vendor_id: correlation.vendorId,
    raw_email_content: {
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      attachments: emailData.attachments.map(att => att.filename || 'attachment'),
    },
    status: 'received',
    received_at: new Date(),
  });

  await proposal.save();
  console.log(`Proposal created: ${proposal._id}`);

  // Parse proposal data using AI
  try {
    const parsedData = await aiService.parseProposal(emailData);

    // Update proposal with parsed data
    proposal.parsed_data = parsedData;
    proposal.parsing_confidence = parsedData.confidence || 0;
    proposal.requires_review = parsedData.confidence < 0.7;
    proposal.status = 'parsed';
    proposal.parsed_at = new Date();

    await proposal.save();
    console.log(`Proposal parsed with confidence: ${parsedData.confidence}`);
  } catch (parseError) {
    console.error('Error parsing proposal:', parseError.message);
    // Keep proposal in 'received' status if parsing fails
    proposal.requires_review = true;
    await proposal.save();
  }

  // Update RFP status to 'receiving_proposals' if it's still 'sent'
  await RFP.findByIdAndUpdate(
    correlation.rfpId,
    { status: 'receiving_proposals' },
    { new: true }
  );

  // Populate vendor details for response
  await proposal.populate('vendor_id', 'name email');

  res.status(201).json({
    message: 'Proposal received and processed successfully',
    proposal: {
      id: proposal._id,
      rfp_id: proposal.rfp_id,
      vendor: {
        id: proposal.vendor_id._id,
        name: proposal.vendor_id.name,
        email: proposal.vendor_id.email,
      },
      parsed_data: proposal.parsed_data,
      parsing_confidence: proposal.parsing_confidence,
      requires_review: proposal.requires_review,
      status: proposal.status,
      received_at: proposal.received_at,
      parsed_at: proposal.parsed_at,
    },
  });
});

/**
 * Get all proposals for a specific RFP
 * GET /api/rfps/:id/proposals
 */
export const getProposalsByRFP = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify RFP exists
  const rfp = await RFP.findById(id);
  if (!rfp) {
    throw new NotFoundError('RFP');
  }

  // Fetch all proposals for this RFP
  const proposals = await Proposal.find({ rfp_id: id })
    .populate('vendor_id', 'name email contact_person specialization')
    .sort({ received_at: -1 });

  res.status(200).json({
    rfp_id: id,
    rfp_title: rfp.title,
    proposal_count: proposals.length,
    proposals: proposals.map(p => ({
      _id: p._id,
      id: p._id,
      vendor_id: {
        _id: p.vendor_id._id,
        id: p.vendor_id._id,
        name: p.vendor_id.name,
        email: p.vendor_id.email,
        contact_person: p.vendor_id.contact_person,
        specialization: p.vendor_id.specialization,
      },
      raw_email_content: p.raw_email_content,
      parsed_data: p.parsed_data,
      total_price: p.parsed_data?.total_price,
      delivery_timeline: p.parsed_data?.delivery_timeline,
      parsing_confidence: p.parsing_confidence,
      requires_review: p.requires_review,
      status: p.status,
      received_at: p.received_at,
      parsed_at: p.parsed_at,
    })),
  });
});

/**
 * Get AI comparison and recommendation for proposals
 * GET /api/rfps/:id/comparison
 */
export const getComparison = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify RFP exists
  const rfp = await RFP.findById(id);
  if (!rfp) {
    throw new NotFoundError('RFP');
  }

  // Fetch all proposals for this RFP
  const proposals = await Proposal.find({ rfp_id: id })
    .populate('vendor_id', 'name email contact_person specialization');

  if (proposals.length === 0) {
    // Return empty response instead of error when no proposals exist
    return res.status(200).json({
      rfp_id: id,
      rfp_title: rfp.title,
      proposal_count: 0,
      proposals: [],
      analysis: null,
      recommendation: null,
      summary: 'No proposals have been received yet for this RFP.',
    });
  }

  // Generate AI comparison and recommendation
  let comparison;
  try {
    comparison = await aiService.compareProposals(rfp, proposals);
  } catch (aiError) {
    console.error('Error generating AI comparison:', aiError);
    // Return proposals without AI comparison if AI fails
    return res.status(200).json({
      rfp_id: id,
      rfp_title: rfp.title,
      proposal_count: proposals.length,
      proposals: proposals.map(p => ({
        _id: p._id,
        id: p._id,
        vendor_id: {
          _id: p.vendor_id._id,
          id: p.vendor_id._id,
          name: p.vendor_id.name,
          email: p.vendor_id.email,
        },
        raw_email_content: p.raw_email_content,
        parsed_data: p.parsed_data,
        total_price: p.parsed_data?.total_price,
        parsing_confidence: p.parsing_confidence,
        requires_review: p.requires_review,
        status: p.status,
        received_at: p.received_at,
      })),
      analysis: null,
      recommendation: null,
      summary: 'AI comparison is temporarily unavailable. Please review proposals manually.',
      error: 'AI service error',
    });
  }

  res.status(200).json({
    rfp_id: id,
    rfp_title: rfp.title,
    proposal_count: proposals.length,
    proposals: proposals.map(p => ({
      _id: p._id,
      id: p._id,
      vendor_id: {
        _id: p.vendor_id._id,
        id: p.vendor_id._id,
        name: p.vendor_id.name,
        email: p.vendor_id.email,
      },
      raw_email_content: p.raw_email_content,
      parsed_data: p.parsed_data,
      total_price: p.parsed_data?.total_price,
      parsing_confidence: p.parsing_confidence,
      requires_review: p.requires_review,
      status: p.status,
      received_at: p.received_at,
    })),
    analysis: comparison.proposal_analysis,
    recommendation: comparison.recommendation,
    summary: comparison.summary,
  });
});
