# ProcureAI: AI-Powered RFP Management System

A full-stack web application that streamlines the procurement workflow by automating RFP creation, vendor communication, proposal parsing, and intelligent vendor selection using artificial intelligence.

## 🎯 Overview

The AI-Powered RFP Management System transforms the traditionally manual and error-prone procurement process into an automated, intelligent workflow. Procurement managers can create structured RFPs from natural language descriptions, automatically distribute them to vendors via email, receive and parse vendor responses, and get AI-powered recommendations for vendor selection.

### Key Features

- **Natural Language RFP Creation**: Convert free-form descriptions into structured procurement documents using AI
- **Vendor Management**: Maintain a database of vendors with contact information and specializations
- **Automated Email Distribution**: Send RFPs to multiple vendors with professional formatting and tracking
- **Intelligent Proposal Parsing**: Automatically extract structured data from vendor email responses in various formats
- **AI-Powered Comparison**: Get intelligent analysis and recommendations comparing all vendor proposals
- **End-to-End Workflow**: Complete procurement cycle from RFP creation to vendor selection in one system

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19.2.0 with functional components and hooks
- Tailwind CSS 4.1.17 for styling
- Vite 7.2.4 for build tooling and development
- React Router 7.10.0 for navigation
- Axios for API communication

**Backend:**
- Node.js (v18+) with Express 5.2.1
- MongoDB with Mongoose 9.0.0 ODM
- OpenAI API (GPT-4) for AI processing
- Nodemailer 7.0.11 for email functionality
- IMAP for receiving vendor responses

**External Services:**
- OpenAI API for natural language processing
- SMTP/IMAP email service (Gmail, SendGrid, AWS SES)
- MongoDB database (local or MongoDB Atlas)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RFP Creation │  │   Vendor     │  │  Proposal    │      │
│  │     View     │  │  Management  │  │  Comparison  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────┴─────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers: RFP, Vendor, Proposal                   │   │
│  └────────────────────┬─────────────────────────────────┘   │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │  Services: AI, Email, Polling                         │   │
│  └────────────────────┬─────────────────────────────────┘   │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │  Models: RFP, Vendor, Proposal (Mongoose)            │   │
│  └────────────────────┬─────────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────────┘
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ MongoDB │    │ OpenAI  │    │  Email  │
    │Database │    │   API   │    │ Service │
    └─────────┘    └─────────┘    └─────────┘
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)
- **Email Account** - Gmail, SendGrid, or AWS SES for SMTP/IMAP

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rfp-management-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Configure your environment variables in `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/rfp-management

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Email Configuration (SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Email Configuration (IMAP - for receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_specific_password
IMAP_TLS=true

# Email Polling
ENABLE_EMAIL_POLLING=true
EMAIL_POLLING_INTERVAL=5
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Configure your environment variables in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Start MongoDB

If using local MongoDB:

```bash
# macOS/Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
```

Or use MongoDB Atlas cloud database.

### 5. Run the Application

**Start Backend** (in `backend` directory):
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

**Start Frontend** (in `frontend` directory):
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📧 Email Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App-Specific Password**:
   - Go to Google Account Settings > Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in your `.env` file

3. **Enable IMAP**:
   - Go to Gmail Settings > Forwarding and POP/IMAP
   - Enable IMAP access

4. **Configure `.env`**:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_16_character_app_password
```

### Alternative Email Services

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

**AWS SES:**
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
```

## 🔌 API Endpoints

### Vendor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors` | Create a new vendor |
| GET | `/api/vendors` | Get all vendors |
| PUT | `/api/vendors/:id` | Update a vendor |
| DELETE | `/api/vendors/:id` | Delete a vendor |

**Example - Create Vendor:**
```bash
curl -X POST http://localhost:5000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Supplies Inc",
    "email": "contact@officesupplies.com",
    "contact_person": "John Doe",
    "phone": "+1-555-0123",
    "specialization": "Office Furniture"
  }'
```

### RFP Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfps` | Create RFP from natural language |
| GET | `/api/rfps` | Get all RFPs |
| GET | `/api/rfps/:id` | Get RFP details |
| POST | `/api/rfps/:id/send` | Send RFP to vendors |

**Example - Create RFP:**
```bash
curl -X POST http://localhost:5000/api/rfps \
  -H "Content-Type: application/json" \
  -d '{
    "description": "We need 50 ergonomic office chairs with lumbar support and 25 electric standing desks. Budget is $30,000. Delivery needed within 45 days. Payment terms net 30. Minimum 2-year warranty required.",
    "budget": 30000
  }'
```

**Example - Send RFP:**
```bash
curl -X POST http://localhost:5000/api/rfps/{rfp_id}/send \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_ids": ["vendor_id_1", "vendor_id_2"]
  }'
```

### Proposal Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/proposals/inbound` | Receive vendor email response |
| GET | `/api/rfps/:id/proposals` | Get all proposals for RFP |
| GET | `/api/rfps/:id/comparison` | Get AI comparison & recommendation |

**Example - Get Comparison:**
```bash
curl http://localhost:5000/api/rfps/{rfp_id}/comparison
```

## 💾 Database Schema

### RFP Model
```javascript
{
  title: String,
  description: String,  // Original natural language input
  structured_data: {
    items: [{ name, description, quantity, specifications }],
    budget: Number,
    delivery_timeline: String,
    payment_terms: String,
    warranty_requirements: String,
    special_conditions: [String]
  },
  budget: Number,
  deadline: Date,
  status: Enum['draft', 'sent', 'receiving_proposals', 'closed'],
  vendors: [{ vendor_id, sent_at }],
  created_at: Date,
  updated_at: Date
}
```

### Vendor Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  contact_person: String,
  phone: String,
  specialization: String,
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

### Proposal Model
```javascript
{
  rfp_id: ObjectId (ref: RFP),
  vendor_id: ObjectId (ref: Vendor),
  raw_email_content: {
    from: String,
    subject: String,
    body: String,
    attachments: [String]
  },
  parsed_data: {
    line_items: [{ item_name, unit_price, quantity, total_price }],
    total_price: Number,
    delivery_timeline: String,
    payment_terms: String,
    warranty_terms: String,
    special_conditions: [String]
  },
  parsing_confidence: Number (0-1),
  requires_review: Boolean,
  received_at: Date,
  parsed_at: Date,
  status: Enum['received', 'parsed', 'reviewed']
}
```

## 🎨 User Interface

### Main Views

1. **Vendor Management** (`/vendors`)
   - View all vendors in a table
   - Add new vendors with a modal form
   - Edit existing vendor information
   - Delete vendors with confirmation

2. **RFP Creation** (`/create-rfp`)
   - Enter natural language description
   - AI generates structured RFP
   - Select vendors to send RFP
   - Send RFP via email

3. **RFP Dashboard** (`/dashboard`)
   - View all RFPs with status
   - Filter by status (draft, sent, receiving_proposals, closed)
   - See proposal count for each RFP
   - Navigate to proposal comparison

4. **Proposal Comparison** (`/rfps/:id/comparison`)
   - Side-by-side comparison of all proposals
   - AI-generated recommendation with reasoning
   - View detailed proposal data
   - Access original vendor emails

## 🤖 AI Integration

### Use Cases

1. **RFP Structuring**
   - Converts natural language to structured format
   - Extracts items, budget, timeline, terms
   - Model: GPT-4-turbo-preview

2. **Proposal Parsing**
   - Extracts data from unstructured vendor emails
   - Handles various formats (plain text, tables, PDFs)
   - Calculates confidence scores
   - Flags low-confidence parses for review

3. **Proposal Comparison**
   - Analyzes all proposals against RFP requirements
   - Scores vendors on price, delivery, terms, completeness
   - Provides recommendation with detailed reasoning
   - Highlights strengths, weaknesses, and red flags

### AI Configuration

The system uses OpenAI's GPT models. Configure in `.env`:

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo for faster/cheaper
```

## 🧪 Testing

### Backend Tests

Run all backend tests:
```bash
cd backend
node test-e2e-all.js
```

Individual test suites:
```bash
# Test RFP endpoints
node test-rfp-api.js

# Test vendor endpoints
node test-vendor-api.js

# Test proposal endpoints
node test-proposal-api.js

# Test email functionality
node test-email-receive.js

# Test error handling
node test-error-handling.js

# Test complete workflow
node test-e2e-workflow.js
```

### Frontend Testing

```bash
cd frontend
node test-rfp-dashboard.js
```

## 🔧 Design Decisions

### Why MongoDB?
- **Flexible Schema**: RFP structures vary significantly between procurement needs
- **JSON Storage**: Natural fit for AI-generated structured data
- **Document Model**: Handles unpredictable proposal formats well
- **Rapid Development**: Faster iteration with flexible schema

### Why Synchronous AI Processing?
- **Simpler Implementation**: Adequate for single-user system
- **Immediate Feedback**: Users expect results after submission
- **Loading States**: Provide good UX during 5-15 second operations
- **Future Scalability**: Can migrate to job queue for multi-user

### Email Polling vs Webhooks
- **Both Supported**: System implements both strategies
- **Polling for Dev**: Simpler setup, no public endpoint needed
- **Webhooks for Prod**: More efficient, real-time processing
- **Configurable**: Choose based on deployment environment

### Embedded vs Referenced Data
- **Hybrid Approach**: Balance between performance and consistency
- **Embedded Vendor Sends**: Quick access to RFP send history
- **Referenced Proposals**: Maintains data integrity, allows updates

## 🚧 Known Limitations

1. **Single-User System**: No authentication or multi-user support
2. **Email Correlation**: Relies on subject line format or vendor matching
3. **AI Rate Limits**: OpenAI API rate limits may affect high-volume usage
4. **Attachment Handling**: Limited support for complex document formats
5. **No Real-Time Updates**: Requires manual refresh to see new proposals

## 🔮 Future Enhancements

- **Multi-User Support**: Add authentication and user management
- **Real-Time Updates**: WebSocket integration for live notifications
- **Advanced Analytics**: Dashboard with procurement metrics and trends
- **Template Library**: Save and reuse RFP templates
- **Vendor Ratings**: Track vendor performance over time
- **Document Generation**: Export RFPs and comparisons to PDF
- **Approval Workflows**: Multi-stage approval process
- **Mobile App**: React Native mobile interface
- **Integration APIs**: Connect with ERP/procurement systems
- **Fine-Tuned Models**: Industry-specific AI models

## 📚 Learning and AI Tools Usage

This project was developed with assistance from AI tools to accelerate development and implement best practices:

### AI-Assisted Development
- **Architecture Design**: AI helped design the system architecture and data models
- **Code Generation**: Boilerplate code and API endpoints generated with AI assistance
- **Error Handling**: Comprehensive error handling patterns suggested by AI
- **Testing Strategy**: Test cases and scenarios developed with AI guidance
- **Documentation**: README and inline documentation enhanced with AI

### Key Learnings
1. **AI Integration**: Learned to effectively integrate OpenAI API for NLP tasks
2. **Email Automation**: Implemented IMAP polling and SMTP sending
3. **React Patterns**: Modern React hooks and component patterns
4. **MongoDB Design**: Document-oriented database design for flexible schemas
5. **Error Handling**: Comprehensive error handling across full stack
6. **Testing**: End-to-end testing strategies for complex workflows

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running. Start with `mongod` command or check MongoDB Atlas connection string.

### OpenAI API Errors
```
Error: 401 Unauthorized
```
**Solution**: Verify `OPENAI_API_KEY` is correct and has sufficient credits.

### Email Sending Failures
```
Error: Invalid login
```
**Solution**: For Gmail, use App-Specific Password, not regular password. Enable IMAP access.

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL.

### Email Polling Not Working
```
No emails being received
```
**Solution**: 
- Check `ENABLE_EMAIL_POLLING=true` in `.env`
- Verify IMAP credentials are correct
- Ensure vendor replies include `[RFP-{id}]` in subject line

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in `/backend/README.md` and `/frontend/README.md`
- Review test files for usage examples

---

**Built with ❤️ using React, Node.js, MongoDB, and OpenAI**
