import mongoose from 'mongoose';

const rfpSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'RFP title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'RFP description is required']
  },
  structured_data: {
    items: [{
      name: String,
      description: String,
      quantity: Number,
      specifications: mongoose.Schema.Types.Mixed
    }],
    budget: Number,
    delivery_timeline: String,
    payment_terms: String,
    warranty_requirements: String,
    special_conditions: [String]
  },
  budget: {
    type: Number
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'receiving_proposals', 'closed'],
    default: 'draft'
  },
  vendors: [{
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    sent_at: {
      type: Date
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Index for faster status-based queries
rfpSchema.index({ status: 1 });
rfpSchema.index({ created_at: -1 });

const RFP = mongoose.model('RFP', rfpSchema);

export default RFP;
