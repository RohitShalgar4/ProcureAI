import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

class EmailService {
  constructor() {
    this.transporter = null;
    this.imapClient = null;
    this.isPolling = false;
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter based on environment configuration
   */
  initializeTransporter() {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    try {
      if (emailService === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
      } else if (emailService === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
      }

      console.log(`Email service initialized with ${emailService}`);
    } catch (error) {
      console.error('Failed to initialize email transporter:', error.message);
      throw new Error('Email service initialization failed');
    }
  }

  /**
   * Test email connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error.message);
      throw new Error(`Email connection failed: ${error.message}`);
    }
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate multiple email addresses
   * @param {string[]} emails - Array of email addresses
   * @returns {Object} Object with valid and invalid emails
   */
  validateEmails(emails) {
    const valid = [];
    const invalid = [];

    emails.forEach(email => {
      if (this.validateEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  }

  /**
   * Send email with error handling
   * @param {Object} mailOptions - Nodemailer mail options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(mailOptions) {
    try {
      // Validate recipient email
      if (!this.validateEmail(mailOptions.to)) {
        throw new Error(`Invalid recipient email: ${mailOptions.to}`);
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${mailOptions.to}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        recipient: mailOptions.to,
      };
    } catch (error) {
      console.error(`Failed to send email to ${mailOptions.to}:`, error.message);
      return {
        success: false,
        error: error.message,
        recipient: mailOptions.to,
      };
    }
  }

  /**
   * Format structured RFP data into readable email content
   * @param {Object} rfp - RFP object with structured_data
   * @returns {string} Formatted email body
   */
  formatRFPForEmail(rfp) {
    let emailBody = `Dear Vendor,\n\n`;
    emailBody += `We are seeking proposals for the following procurement requirement:\n\n`;
    emailBody += `=== RFP DETAILS ===\n\n`;
    emailBody += `Title: ${rfp.title}\n\n`;

    if (rfp.description) {
      emailBody += `Description:\n${rfp.description}\n\n`;
    }

    // Format items
    if (rfp.structured_data?.items && rfp.structured_data.items.length > 0) {
      emailBody += `ITEMS REQUESTED:\n`;
      emailBody += `${'='.repeat(50)}\n\n`;

      rfp.structured_data.items.forEach((item, index) => {
        emailBody += `${index + 1}. ${item.name}\n`;
        if (item.description) {
          emailBody += `   Description: ${item.description}\n`;
        }
        if (item.quantity) {
          emailBody += `   Quantity: ${item.quantity}\n`;
        }
        if (item.specifications && Object.keys(item.specifications).length > 0) {
          emailBody += `   Specifications:\n`;
          Object.entries(item.specifications).forEach(([key, value]) => {
            emailBody += `     - ${key}: ${value}\n`;
          });
        }
        emailBody += `\n`;
      });
    }

    // Format budget
    if (rfp.structured_data?.budget || rfp.budget) {
      const budget = rfp.structured_data?.budget || rfp.budget;
      emailBody += `BUDGET: $${budget.toLocaleString()}\n\n`;
    }

    // Format delivery timeline
    if (rfp.structured_data?.delivery_timeline) {
      emailBody += `DELIVERY TIMELINE: ${rfp.structured_data.delivery_timeline}\n\n`;
    }

    // Format payment terms
    if (rfp.structured_data?.payment_terms) {
      emailBody += `PAYMENT TERMS: ${rfp.structured_data.payment_terms}\n\n`;
    }

    // Format warranty requirements
    if (rfp.structured_data?.warranty_requirements) {
      emailBody += `WARRANTY REQUIREMENTS: ${rfp.structured_data.warranty_requirements}\n\n`;
    }

    // Format special conditions
    if (rfp.structured_data?.special_conditions && rfp.structured_data.special_conditions.length > 0) {
      emailBody += `SPECIAL CONDITIONS:\n`;
      rfp.structured_data.special_conditions.forEach((condition, index) => {
        emailBody += `${index + 1}. ${condition}\n`;
      });
      emailBody += `\n`;
    }

    // Format deadline
    if (rfp.deadline) {
      const deadlineDate = new Date(rfp.deadline);
      emailBody += `RESPONSE DEADLINE: ${deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}\n\n`;
    }

    // Instructions
    emailBody += `${'='.repeat(50)}\n\n`;
    emailBody += `RESPONSE INSTRUCTIONS:\n`;
    emailBody += `Please reply to this email with your proposal including:\n`;
    emailBody += `- Detailed pricing for each item\n`;
    emailBody += `- Delivery timeline\n`;
    emailBody += `- Payment terms\n`;
    emailBody += `- Warranty information\n`;
    emailBody += `- Any special conditions or notes\n\n`;
    emailBody += `Please keep the RFP reference number in the subject line when replying.\n\n`;
    emailBody += `Thank you for your consideration.\n\n`;
    emailBody += `Best regards,\n`;
    emailBody += `Procurement Team`;

    return emailBody;
  }

  /**
   * Send RFP to a single vendor
   * @param {Object} rfp - RFP object
   * @param {Object} vendor - Vendor object
   * @returns {Promise<Object>} Send result
   */
  async sendRFPToVendor(rfp, vendor) {
    try {
      const subject = `Request for Proposal - ${rfp.title} [RFP-${rfp._id}]`;
      const emailBody = this.formatRFPForEmail(rfp);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: vendor.email,
        subject: subject,
        text: emailBody,
      };

      const result = await this.sendEmail(mailOptions);

      return {
        ...result,
        vendorId: vendor._id,
        vendorName: vendor.name,
      };
    } catch (error) {
      console.error(`Error sending RFP to vendor ${vendor.name}:`, error.message);
      return {
        success: false,
        error: error.message,
        vendorId: vendor._id,
        vendorName: vendor.name,
        recipient: vendor.email,
      };
    }
  }

  /**
   * Send RFP to multiple vendors
   * @param {Object} rfp - RFP object
   * @param {Array} vendors - Array of vendor objects
   * @returns {Promise<Object>} Results object with success/failure counts
   */
  async sendRFPToVendors(rfp, vendors) {
    const results = {
      total: vendors.length,
      successful: [],
      failed: [],
      errors: [],
    };

    // Validate all vendor emails first
    const emailValidation = this.validateEmails(vendors.map(v => v.email));

    if (emailValidation.invalid.length > 0) {
      console.warn(`Invalid vendor emails found: ${emailValidation.invalid.join(', ')}`);
    }

    // Send emails to each vendor with individual error handling
    const sendPromises = vendors.map(vendor => this.sendRFPToVendor(rfp, vendor));
    const sendResults = await Promise.allSettled(sendPromises);

    sendResults.forEach((result, index) => {
      const vendor = vendors[index];

      if (result.status === 'fulfilled' && result.value.success) {
        results.successful.push({
          vendorId: vendor._id,
          vendorName: vendor.name,
          email: vendor.email,
          messageId: result.value.messageId,
        });
      } else {
        const errorMessage = result.status === 'rejected'
          ? result.reason.message
          : result.value.error;

        results.failed.push({
          vendorId: vendor._id,
          vendorName: vendor.name,
          email: vendor.email,
        });

        results.errors.push({
          vendor: vendor.name,
          email: vendor.email,
          error: errorMessage,
        });
      }
    });

    console.log(`RFP sent: ${results.successful.length} successful, ${results.failed.length} failed`);

    return results;
  }

  /**
   * Initialize IMAP client for receiving emails
   * @returns {Imap} IMAP client instance
   */
  initializeImapClient() {
    if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
      throw new Error('IMAP credentials not configured');
    }

    const imapConfig = {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: process.env.IMAP_TLS !== 'false',
      tlsOptions: { rejectUnauthorized: false },
    };

    return new Imap(imapConfig);
  }

  /**
   * Correlate incoming email to RFP
   * @param {Object} email - Parsed email object
   * @param {Function} findRFPCallback - Async function to find RFP in database
   * @param {Function} findVendorCallback - Async function to find vendor in database
   * @returns {Promise<Object>} Correlation result with rfpId and vendorId
   */
  async correlateEmailToRFP(email, findRFPCallback, findVendorCallback) {
    let rfpId = null;
    let vendorId = null;

    // Strategy 1: Extract RFP ID from subject line
    const rfpIdMatch = email.subject?.match(/\[RFP-([a-f0-9]+)\]/i);
    if (rfpIdMatch) {
      rfpId = rfpIdMatch[1];
      console.log(`RFP ID extracted from subject: ${rfpId}`);
    }

    // Strategy 2: Match vendor by email address
    const fromEmail = email.from; // Now using the cleaned email from extractEmailData
    if (fromEmail && findVendorCallback) {
      try {
        console.log(`Looking for vendor with email: ${fromEmail}`);
        const vendor = await findVendorCallback(fromEmail);
        if (vendor) {
          vendorId = vendor._id;
          console.log(`Vendor matched: ${vendor.name} (${fromEmail})`);

          // If no RFP ID found in subject, try to find most recent RFP sent to this vendor
          if (!rfpId && findRFPCallback) {
            const recentRFP = await findRFPCallback(vendorId);
            if (recentRFP) {
              rfpId = recentRFP._id;
              console.log(`RFP matched by vendor history: ${rfpId}`);
            }
          }
        } else {
          console.warn(`No vendor found with email: ${fromEmail}`);
        }
      } catch (error) {
        console.error('Error finding vendor:', error.message);
      }
    } else {
      console.error('No from email found in email data');
    }

    return {
      rfpId,
      vendorId,
      fromEmail,
      success: !!(rfpId && vendorId),
    };
  }

  /**
   * Parse email content and extract relevant data
   * @param {Object} mail - Parsed mail object from mailparser
   * @returns {Object} Extracted email data
   */
  extractEmailData(mail) {
    // Try multiple ways to extract the from address
    let fromEmail = null;
    let fromName = '';

    // Method 1: from.value array
    if (mail.from?.value?.[0]?.address) {
      fromEmail = mail.from.value[0].address;
      fromName = mail.from.value[0].name || '';
    }
    // Method 2: from.text
    else if (mail.from?.text) {
      // Extract email from text like "Name <email@example.com>"
      const emailMatch = mail.from.text.match(/<(.+?)>/) || mail.from.text.match(/([^\s]+@[^\s]+)/);
      fromEmail = emailMatch ? emailMatch[1] : mail.from.text;
      fromName = mail.from.text.replace(/<.+?>/, '').trim();
    }
    // Method 3: Direct from field
    else if (typeof mail.from === 'string') {
      const emailMatch = mail.from.match(/<(.+?)>/) || mail.from.match(/([^\s]+@[^\s]+)/);
      fromEmail = emailMatch ? emailMatch[1] : mail.from;
    }

    // Log for debugging
    if (!fromEmail) {
      console.error('Failed to extract from email. Mail.from structure:', JSON.stringify(mail.from));
    }

    return {
      from: fromEmail,
      fromName: fromName,
      subject: mail.subject || '',
      body: mail.text || mail.html || '',
      html: mail.html || '',
      date: mail.date || new Date(),
      messageId: mail.messageId || '',
      attachments: mail.attachments?.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        content: att.content?.toString('base64') || null,
      })) || [],
    };
  }

  /**
   * Fetch unread emails from IMAP inbox
   * @param {Function} onEmailReceived - Callback function for each email
   * @returns {Promise<number>} Number of emails processed
   */
  async fetchUnreadEmails(onEmailReceived) {
    return new Promise((resolve, reject) => {
      const imap = this.initializeImapClient();
      let emailCount = 0;

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Search for unseen emails
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              console.log('No unread emails found');
              imap.end();
              return resolve(0);
            }

            console.log(`Found ${results.length} unread email(s)`);
            const fetch = imap.fetch(results, { bodies: '', markSeen: true });

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, mail) => {
                  if (err) {
                    console.error(`Error parsing email ${seqno}:`, err.message);
                    return;
                  }

                  try {
                    const emailData = this.extractEmailData(mail);
                    console.log(`Processing email from: ${emailData.from}`);

                    if (onEmailReceived) {
                      await onEmailReceived(emailData);
                    }

                    emailCount++;
                  } catch (error) {
                    console.error(`Error processing email ${seqno}:`, error.message);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err.message);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              console.log(`Finished processing ${emailCount} email(s)`);
              imap.end();
              resolve(emailCount);
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP connection error:', err.message);
        reject(err);
      });

      imap.once('end', () => {
        console.log('IMAP connection ended');
      });

      imap.connect();
    });
  }

  /**
   * Start polling for new emails at regular intervals
   * @param {Function} onEmailReceived - Callback function for each email
   * @param {number} intervalMinutes - Polling interval in minutes (default: 5)
   */
  startEmailPolling(onEmailReceived, intervalMinutes = 5) {
    if (this.isPolling) {
      console.log('Email polling is already running');
      return;
    }

    this.isPolling = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`Starting email polling every ${intervalMinutes} minute(s)`);

    // Initial fetch
    this.fetchUnreadEmails(onEmailReceived).catch(err => {
      console.error('Error in initial email fetch:', err.message);
    });

    // Set up interval
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchUnreadEmails(onEmailReceived);
      } catch (error) {
        console.error('Error in email polling:', error.message);
      }
    }, intervalMs);
  }

  /**
   * Stop email polling
   */
  stopEmailPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Email polling stopped');
    }
  }

  /**
   * Process inbound email webhook (for SendGrid, Mailgun, etc.)
   * @param {Object} webhookData - Webhook payload from email service
   * @returns {Object} Extracted email data
   */
  processInboundWebhook(webhookData) {
    // Generic webhook processing - adapt based on email service
    // This is a basic implementation that can be extended

    return {
      from: webhookData.from || webhookData.sender,
      fromName: webhookData.from_name || '',
      subject: webhookData.subject,
      body: webhookData.text || webhookData.body || webhookData.plain,
      html: webhookData.html,
      date: webhookData.date ? new Date(webhookData.date) : new Date(),
      messageId: webhookData.message_id || webhookData.messageId || '',
      attachments: webhookData.attachments || [],
    };
  }
}

export default EmailService;
