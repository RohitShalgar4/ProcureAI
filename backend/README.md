# RFP Management System - Backend

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key (for AI features)
- Email account for SMTP (Gmail, SendGrid, or AWS SES)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - Set `MONGO_URI` to your MongoDB connection string
   - Set `OPENAI_API_KEY` to your OpenAI API key
   - Configure email settings (Gmail SMTP recommended for development)
   - Set `FRONTEND_URL` to your frontend URL (default: http://localhost:5173)

### Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

### Environment Variables

See `.env.example` for all available configuration options.

#### Required Variables:
- `MONGO_URI` - MongoDB connection string

#### Recommended Variables:
- `OPENAI_API_KEY` - Required for AI features (RFP structuring, proposal parsing, comparison)
- `EMAIL_USER` - Required for sending RFPs to vendors
- `EMAIL_PASSWORD` - Required for email functionality

### API Endpoints

#### Health Check
- `GET /health` - Check if the API is running

#### Vendor Management
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors` - Get all vendors
- `PUT /api/vendors/:id` - Update a vendor
- `DELETE /api/vendors/:id` - Delete a vendor

#### RFP Management
- `POST /api/rfps` - Create RFP from natural language description
  - Request body: `{ description: string, budget?: number, deadline?: date }`
  - Uses AI to structure the RFP automatically
- `GET /api/rfps` - Get all RFPs with proposal counts
- `GET /api/rfps/:id` - Get detailed RFP by ID
- `POST /api/rfps/:id/send` - Send RFP to selected vendors
  - Request body: `{ vendor_ids: string[] }`
  - Sends emails to vendors and updates RFP status

#### Proposal Management
- `POST /api/proposals/inbound` - Receive vendor email responses (webhook endpoint)
- `GET /api/rfps/:id/proposals` - Get all proposals for a specific RFP
- `GET /api/rfps/:id/comparison` - Get AI comparison and recommendation for proposals

#### Email Management
- `POST /api/email/fetch` - Manually trigger email fetch (for testing)

### Testing the API

A test script is provided to verify the RFP endpoints:

```bash
# Make sure the server is running first
npm run dev

# In another terminal, run the test script
node test-rfp-api.js
```

The test script will:
1. Create an RFP from natural language
2. Fetch all RFPs
3. Get RFP details
4. Fetch available vendors
5. Send the RFP to vendors
6. Verify the RFP status was updated

You can also test individual endpoints using curl:

```bash
# Create an RFP
curl -X POST http://localhost:5000/api/rfps \
  -H "Content-Type: application/json" \
  -d '{
    "description": "We need 50 office chairs with ergonomic design and 25 standing desks. Budget is $30,000. Delivery in 45 days.",
    "budget": 30000
  }'

# Get all RFPs
curl http://localhost:5000/api/rfps

# Get RFP by ID
curl http://localhost:5000/api/rfps/{rfp_id}

# Send RFP to vendors
curl -X POST http://localhost:5000/api/rfps/{rfp_id}/send \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_ids": ["vendor_id_1", "vendor_id_2"]
  }'
```

### Email Receiving Configuration

The system supports two methods for receiving vendor email responses:

#### Method 1: IMAP Polling (Recommended for Development)

1. Configure IMAP settings in `.env`:
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_specific_password
IMAP_TLS=true
```

2. Enable email polling:
```env
ENABLE_EMAIL_POLLING=true
EMAIL_POLLING_INTERVAL=5  # Check every 5 minutes
```

3. The system will automatically check for new emails and create proposals

**For Gmail:**
- Use an App-Specific Password (not your regular password)
- Enable IMAP in Gmail settings (Settings > Forwarding and POP/IMAP)

#### Method 2: Webhook (Recommended for Production)

Configure your email service (SendGrid, Mailgun, etc.) to POST to:
```
POST /api/proposals/inbound
```

**Request Body:**
```json
{
  "from": "vendor@example.com",
  "subject": "Re: Request for Proposal - Office Furniture [RFP-abc123]",
  "body": "Email body text...",
  "html": "<html>Email HTML...</html>",
  "attachments": []
}
```

#### Manual Email Fetch (Testing)

Trigger a manual email fetch:
```bash
curl -X POST http://localhost:5000/api/email/fetch
```

### Email Correlation

The system correlates incoming emails to RFPs using:
1. **RFP ID in subject line**: `[RFP-{id}]` format
2. **Vendor email matching**: Matches sender email to vendor database
3. **Recent RFP history**: Finds most recent RFP sent to the vendor

### Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── database/        # Database connection
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic (AI, Email, Polling)
├── index.js         # Main application entry point
├── package.json     # Dependencies
└── .env.example     # Environment variables template
```

### Troubleshooting

**MongoDB Connection Issues:**
- Ensure MongoDB is running locally or your cloud connection string is correct
- Check that `MONGO_URI` is properly set in `.env`
- Verify network connectivity to MongoDB instance

**Email Configuration:**
- For Gmail, you need to use an App-Specific Password (not your regular password)
- Enable "Less secure app access" or use OAuth2 for production
- For SendGrid/AWS SES, ensure API keys have proper permissions

**OpenAI API Issues:**
- Verify your API key is valid and has sufficient credits
- Check rate limits if requests are failing
- Ensure the model specified exists (default: gpt-4-turbo-preview)
