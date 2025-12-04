import EmailService from './EmailService.js';
import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import AIService from './AIService.js';

class EmailPollingService {
  constructor() {
    this.emailService = new EmailService();
    this.aiService = new AIService();
    this.isRunning = false;
  }

  /**
   * Process a received email and create proposal
   * @param {Object} emailData - Extracted email data
   */
  async processReceivedEmail(emailData) {
    try {
      console.log(`Processing email from: ${emailData.from}`);

      // Correlate email to RFP and Vendor
      const correlation = await this.emailService.correlateEmailToRFP(
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
        console.warn('Unable to correlate email to RFP and vendor:', {
          rfpId: correlation.rfpId,
          vendorId: correlation.vendorId,
          fromEmail: correlation.fromEmail,
        });
        return {
          success: false,
          reason: 'correlation_failed',
          details: correlation,
        };
      }

      // Check if proposal already exists
      const existingProposal = await Proposal.findOne({
        rfp_id: correlation.rfpId,
        vendor_id: correlation.vendorId,
      });

      if (existingProposal) {
        console.log(`Proposal already exists for RFP ${correlation.rfpId} from vendor ${correlation.vendorId}`);
        return {
          success: false,
          reason: 'duplicate_proposal',
          proposalId: existingProposal._id,
        };
      }

      // Create proposal record with raw email content
      const proposal = new Proposal({
        rfp_id: correlation.rfpId,
        vendor_id: correlation.vendorId,
        raw_email_content: {
          from: emailData.from,
          subject: emailData.subject,
          body: emailData.body,
          attachments: emailData.attachments?.map(att => att.filename || 'attachment') || [],
        },
        status: 'received',
        received_at: emailData.date || new Date(),
      });

      await proposal.save();
      console.log(`Proposal created: ${proposal._id}`);

      // Parse proposal data using AI
      try {
        const parsedData = await this.aiService.parseProposal(emailData.body);

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
      const rfp = await RFP.findById(correlation.rfpId);
      if (rfp && rfp.status === 'sent') {
        rfp.status = 'receiving_proposals';
        await rfp.save();
        console.log(`RFP ${rfp._id} status updated to 'receiving_proposals'`);
      }

      return {
        success: true,
        proposalId: proposal._id,
        rfpId: correlation.rfpId,
        vendorId: correlation.vendorId,
      };
    } catch (error) {
      console.error('Error processing received email:', error);
      return {
        success: false,
        reason: 'processing_error',
        error: error.message,
      };
    }
  }

  /**
   * Start email polling
   * @param {number} intervalMinutes - Polling interval in minutes (default: 5)
   */
  start(intervalMinutes = 1) {
    if (this.isRunning) {
      console.log('Email polling is already running');
      return;
    }

    console.log(`Starting email polling service (interval: ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Start polling with the email service
    this.emailService.startEmailPolling(
      async (emailData) => {
        await this.processReceivedEmail(emailData);
      },
      intervalMinutes
    );
  }

  /**
   * Stop email polling
   */
  stop() {
    if (!this.isRunning) {
      console.log('Email polling is not running');
      return;
    }

    console.log('Stopping email polling service');
    this.emailService.stopEmailPolling();
    this.isRunning = false;
  }

  /**
   * Manually trigger email fetch (useful for testing)
   */
  async fetchNow() {
    console.log('Manually triggering email fetch');
    try {
      const count = await this.emailService.fetchUnreadEmails(
        async (emailData) => {
          await this.processReceivedEmail(emailData);
        }
      );
      console.log(`Processed ${count} email(s)`);
      return { success: true, count };
    } catch (error) {
      console.error('Error in manual email fetch:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailPollingService;
