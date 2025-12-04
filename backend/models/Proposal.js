import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  rfp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: [true, 'RFP ID is required']
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  raw_email_content: {
    from: String,
    subject: String,
    body: String,
    attachments: [String]
  },
  parsed_data: {
    line_items: [{
      item_name: String,
      unit_price: Number,
      quantity: Number,
      total_price: Number
    }],
    total_price: Number,
    delivery_timeline: String,
    payment_terms: String,
    warranty_terms: String,
    special_conditions: [String],
    notes: String
  },
  parsing_confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  requires_review: {
    type: Boolean,
    default: false
  },
  received_at: {
    type: Date,
    default: Date.now
  },
  parsed_at: {
    type: Date
  },
  status: {
    type: String,
    enum: ['received', 'parsed', 'reviewed'],
    default: 'received'
  }
});

// Indexes for faster queries
proposalSchema.index({ rfp_id: 1 });
proposalSchema.index({ vendor_id: 1 });
proposalSchema.index({ rfp_id: 1, vendor_id: 1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
