import mongoose from 'mongoose';
import Proposal from './models/Proposal.js';
import Vendor from './models/Vendor.js';
import RFP from './models/RFP.js';
import AIService from './services/AIService.js';
import dotenv from 'dotenv';

dotenv.config();

const aiService = new AIService();

async function reparseProposals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all proposals that need reparsing
    const proposals = await Proposal.find({
      $or: [
        { status: 'received' },
        { parsed_data: null },
        { parsed_data: { $exists: false } }
      ]
    }).populate('vendor_id', 'name email');

    console.log(`Found ${proposals.length} proposals to reparse`);

    for (const proposal of proposals) {
      try {
        console.log(`\nReparsing proposal ${proposal._id} from ${proposal.vendor_id?.name || 'Unknown'}...`);
        
        // Check if raw_email_content exists
        if (!proposal.raw_email_content || !proposal.raw_email_content.body) {
          console.log(`  ❌ No email content found for proposal ${proposal._id}`);
          continue;
        }

        console.log(`  Email from: ${proposal.raw_email_content.from}`);
        console.log(`  Email subject: ${proposal.raw_email_content.subject}`);
        console.log(`  Email body length: ${proposal.raw_email_content.body?.length || 0} characters`);

        // Prepare email data for AI parsing
        const emailData = {
          from: proposal.raw_email_content.from,
          subject: proposal.raw_email_content.subject,
          body: proposal.raw_email_content.body,
          attachments: proposal.raw_email_content.attachments || []
        };

        // Parse with AI
        console.log(`  Parsing with AI...`);
        const parsedData = await aiService.parseProposal(emailData);

        // Update proposal
        proposal.parsed_data = parsedData;
        proposal.parsing_confidence = parsedData.confidence || 0;
        proposal.requires_review = parsedData.confidence < 0.7;
        proposal.status = 'parsed';
        proposal.parsed_at = new Date();

        await proposal.save();
        
        console.log(`  ✅ Successfully reparsed with confidence: ${parsedData.confidence}`);
        console.log(`  Total price: $${parsedData.total_price || 'N/A'}`);
        console.log(`  Delivery: ${parsedData.delivery_timeline || 'N/A'}`);
      } catch (error) {
        console.error(`  ❌ Failed to reparse proposal ${proposal._id}:`, error.message);
      }
    }

    console.log('\n✅ Reparsing complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

reparseProposals();
