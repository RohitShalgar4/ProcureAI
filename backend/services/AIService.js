import OpenAI from 'openai';

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: this.apiKey
    });

    // Retry configuration
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  /**
   * Retry logic with exponential backoff
   * @param {Function} fn - Async function to retry
   * @param {number} retries - Number of retries remaining
   * @returns {Promise} - Result of the function
   */
  async retryWithBackoff(fn, retries = this.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      // Check if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (retries > 0 && isRetryable) {
        const delay = this.baseDelay * Math.pow(2, this.maxRetries - retries);
        console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
        
        await this.sleep(delay);
        return this.retryWithBackoff(fn, retries - 1);
      }
      
      // If not retryable or out of retries, throw the error
      throw this.handleError(error);
    }
  }

  /**
   * Determine if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether the error is retryable
   */
  isRetryableError(error) {
    // Rate limiting errors
    if (error.status === 429) return true;
    
    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) return true;
    
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    
    // Timeout errors
    if (error.message && error.message.includes('timeout')) return true;
    
    return false;
  }

  /**
   * Handle and format errors
   * @param {Error} error - The error to handle
   * @returns {Error} - Formatted error
   */
  handleError(error) {
    console.error('AIService Error:', error);

    if (error.status === 401) {
      return new Error('Invalid OpenAI API key');
    }
    
    if (error.status === 429) {
      return new Error('OpenAI API rate limit exceeded. Please try again later.');
    }
    
    if (error.status === 500 || error.status === 503) {
      return new Error('OpenAI service is temporarily unavailable. Please try again later.');
    }
    
    if (error.message && error.message.includes('timeout')) {
      return new Error('Request to OpenAI timed out. Please try again.');
    }

    // Generic error
    return new Error(`AI service error: ${error.message || 'Unknown error occurred'}`);
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a completion request to OpenAI
   * @param {string} systemPrompt - System prompt
   * @param {string} userPrompt - User prompt
   * @returns {Promise<string>} - AI response
   */
  async makeCompletionRequest(systemPrompt, userPrompt) {
    return this.retryWithBackoff(async () => {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    });
  }

  /**
   * Parse JSON response with error handling
   * @param {string} jsonString - JSON string to parse
   * @returns {Object} - Parsed JSON object
   */
  parseJSONResponse(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Raw response:', jsonString);
      throw new Error('Failed to parse AI response. The response was not valid JSON.');
    }
  }

  /**
   * Structure an RFP from natural language description
   * @param {string} naturalLanguageDescription - User's natural language RFP description
   * @returns {Promise<Object>} - Structured RFP data
   */
  async structureRFP(naturalLanguageDescription) {
    if (!naturalLanguageDescription || naturalLanguageDescription.trim().length === 0) {
      throw new Error('RFP description cannot be empty');
    }

    const systemPrompt = `You are an expert procurement assistant. Convert natural language RFP descriptions into structured JSON format.
Your task is to extract and organize procurement information into a standardized format.
Always return valid JSON that matches the specified schema exactly.`;

    const userPrompt = `Convert the following natural language RFP description into a structured JSON format.

User Input: ${naturalLanguageDescription}

Extract and structure the following information:
- title: A concise title for this RFP (required)
- items: Array of items being procured with name, description, quantity, specifications (required, at least one item)
- budget: Total budget as a number if mentioned (optional, use null if not specified)
- delivery_timeline: When delivery is needed as a string (optional)
- payment_terms: Payment conditions as a string (optional)
- warranty_requirements: Warranty expectations as a string (optional)
- special_conditions: Array of any other requirements or conditions (optional, empty array if none)

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "items": [
    {
      "name": "string",
      "description": "string",
      "quantity": number,
      "specifications": {}
    }
  ],
  "budget": number or null,
  "delivery_timeline": "string or null",
  "payment_terms": "string or null",
  "warranty_requirements": "string or null",
  "special_conditions": ["string"]
}

Important:
- If information is not mentioned, use null for single values or empty array for arrays
- Ensure all items have at least name, description, and quantity
- Extract any technical specifications into the specifications object
- Be thorough but concise in descriptions`;

    try {
      const responseContent = await this.makeCompletionRequest(systemPrompt, userPrompt);
      const structuredData = this.parseJSONResponse(responseContent);

      // Validate the response has required fields
      if (!structuredData.title || !structuredData.items || !Array.isArray(structuredData.items) || structuredData.items.length === 0) {
        throw new Error('AI response missing required fields (title or items)');
      }

      // Ensure all items have required fields
      structuredData.items.forEach((item, index) => {
        if (!item.name || !item.description || typeof item.quantity !== 'number') {
          throw new Error(`Item at index ${index} is missing required fields (name, description, or quantity)`);
        }
      });

      // Ensure special_conditions is an array
      if (!Array.isArray(structuredData.special_conditions)) {
        structuredData.special_conditions = [];
      }

      return structuredData;
    } catch (error) {
      console.error('Error structuring RFP:', error);
      throw error;
    }
  }

  /**
   * Parse vendor proposal from email content
   * @param {Object} emailData - Email data containing from, subject, body, attachments
   * @returns {Promise<Object>} - Parsed proposal data with confidence score
   */
  async parseProposal(emailData) {
    if (!emailData || !emailData.body) {
      throw new Error('Email body is required for proposal parsing');
    }

    const systemPrompt = `You are an expert at extracting structured data from vendor proposals and email responses.
Your task is to parse vendor responses and extract pricing, terms, and other relevant information.
Always return valid JSON that matches the specified schema exactly.
Assess your confidence in the extraction accuracy and flag ambiguous information.`;

    const userPrompt = `Parse the following vendor response email and extract pricing and terms information.

Email From: ${emailData.from || 'Unknown'}
Email Subject: ${emailData.subject || 'No subject'}

Email Content:
${emailData.body}

${emailData.attachments && emailData.attachments.length > 0 ? `Attachments: ${emailData.attachments.join(', ')}` : ''}

Extract the following information:
- line_items: Array of items with item_name, unit_price, quantity, total_price (required)
- total_price: Overall total cost as a number (required)
- delivery_timeline: Proposed delivery schedule as a string (optional)
- payment_terms: Payment conditions offered as a string (optional)
- warranty_terms: Warranty information as a string (optional)
- special_conditions: Array of any exceptions, notes, or special terms (optional)
- confidence: Your confidence level (0-1) in the extraction accuracy (required)

Return ONLY valid JSON in this format:
{
  "line_items": [
    {
      "item_name": "string",
      "unit_price": number,
      "quantity": number,
      "total_price": number
    }
  ],
  "total_price": number,
  "delivery_timeline": "string or null",
  "payment_terms": "string or null",
  "warranty_terms": "string or null",
  "special_conditions": ["string"],
  "confidence": number
}

Important:
- If information is missing or unclear, use null for that field and lower the confidence score
- Confidence should be between 0 and 1 (e.g., 0.95 for very confident, 0.6 for uncertain)
- Lower confidence if: information is ambiguous, pricing is incomplete, or key details are missing
- Extract all line items with their individual pricing
- Calculate total_price from line items if not explicitly stated
- Be precise with numbers and avoid assumptions`;

    try {
      const responseContent = await this.makeCompletionRequest(systemPrompt, userPrompt);
      const parsedData = this.parseJSONResponse(responseContent);

      // Validate required fields
      if (!parsedData.line_items || !Array.isArray(parsedData.line_items) || parsedData.line_items.length === 0) {
        throw new Error('AI response missing required field: line_items');
      }

      if (typeof parsedData.total_price !== 'number') {
        throw new Error('AI response missing required field: total_price');
      }

      if (typeof parsedData.confidence !== 'number' || parsedData.confidence < 0 || parsedData.confidence > 1) {
        throw new Error('AI response has invalid confidence score');
      }

      // Validate line items
      parsedData.line_items.forEach((item, index) => {
        if (!item.item_name || typeof item.unit_price !== 'number' || typeof item.quantity !== 'number' || typeof item.total_price !== 'number') {
          throw new Error(`Line item at index ${index} is missing required fields`);
        }
      });

      // Ensure special_conditions is an array
      if (!Array.isArray(parsedData.special_conditions)) {
        parsedData.special_conditions = [];
      }

      // Set requires_review flag based on confidence threshold
      const confidenceThreshold = 0.7;
      parsedData.requires_review = parsedData.confidence < confidenceThreshold;

      return parsedData;
    } catch (error) {
      console.error('Error parsing proposal:', error);
      throw error;
    }
  }

  /**
   * Compare proposals and generate recommendation
   * @param {Object} rfp - RFP object with requirements
   * @param {Array} proposals - Array of proposal objects with vendor details
   * @returns {Promise<Object>} - Comparison analysis and recommendation
   */
  async compareProposals(rfp, proposals) {
    if (!rfp || !rfp.structured_data) {
      throw new Error('RFP with structured_data is required for comparison');
    }

    if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
      throw new Error('At least one proposal is required for comparison');
    }

    const systemPrompt = `You are an expert procurement analyst specializing in vendor proposal evaluation.
Your task is to compare vendor proposals against RFP requirements and provide objective, data-driven recommendations.
Always return valid JSON that matches the specified schema exactly.
Base your analysis on: requirement alignment, pricing competitiveness, terms favorability, and response completeness.`;

    // Format RFP requirements
    const rfpRequirements = JSON.stringify(rfp.structured_data, null, 2);

    // Format proposals with vendor information
    const proposalsFormatted = proposals.map((proposal, index) => {
      return `
Proposal ${index + 1}:
Vendor: ${proposal.vendor?.name || 'Unknown Vendor'} (ID: ${proposal.vendor_id})
Email: ${proposal.vendor?.email || 'N/A'}
Specialization: ${proposal.vendor?.specialization || 'N/A'}

Parsed Data:
${JSON.stringify(proposal.parsed_data, null, 2)}

Parsing Confidence: ${proposal.parsing_confidence || 'N/A'}
Requires Review: ${proposal.requires_review ? 'Yes' : 'No'}
Received At: ${proposal.received_at || 'N/A'}
`;
    }).join('\n---\n');

    const userPrompt = `Compare the following vendor proposals against the RFP requirements and provide a comprehensive analysis with recommendation.

RFP Requirements:
${rfpRequirements}

Budget: ${rfp.budget || 'Not specified'}
Deadline: ${rfp.deadline || 'Not specified'}

Vendor Proposals:
${proposalsFormatted}

Analyze each proposal and provide:
1. A comparison of how well each vendor meets the requirements
2. Scoring on: price competitiveness (0-10), delivery timeline (0-10), terms favorability (0-10), completeness (0-10)
3. Identification of any red flags or missing information
4. A clear recommendation of which vendor to select with detailed reasoning

Return ONLY valid JSON in this format:
{
  "proposal_analysis": [
    {
      "vendor_id": "string",
      "vendor_name": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "scores": {
        "price": number,
        "delivery": number,
        "terms": number,
        "completeness": number
      },
      "total_score": number,
      "red_flags": ["string"]
    }
  ],
  "recommendation": {
    "vendor_id": "string",
    "vendor_name": "string",
    "reasoning": "string (detailed explanation)",
    "confidence": number
  },
  "summary": "string (executive summary of the comparison)"
}

Important:
- Scores should be 0-10 for each category
- Total score should be the average of all category scores
- Confidence should be 0-1 (e.g., 0.9 for very confident)
- Be objective and data-driven in your analysis
- Highlight both strengths and weaknesses for each vendor
- Consider price, quality, timeline, and risk factors
- Provide clear, actionable reasoning for the recommendation`;

    try {
      const responseContent = await this.makeCompletionRequest(systemPrompt, userPrompt);
      const comparisonData = this.parseJSONResponse(responseContent);

      // Validate required fields
      if (!comparisonData.proposal_analysis || !Array.isArray(comparisonData.proposal_analysis)) {
        throw new Error('AI response missing required field: proposal_analysis');
      }

      if (!comparisonData.recommendation || !comparisonData.recommendation.vendor_id) {
        throw new Error('AI response missing required field: recommendation');
      }

      if (!comparisonData.summary) {
        throw new Error('AI response missing required field: summary');
      }

      // Validate each analysis entry
      comparisonData.proposal_analysis.forEach((analysis, index) => {
        if (!analysis.vendor_id || !analysis.vendor_name || !analysis.scores) {
          throw new Error(`Proposal analysis at index ${index} is missing required fields`);
        }

        if (!Array.isArray(analysis.strengths)) {
          analysis.strengths = [];
        }

        if (!Array.isArray(analysis.weaknesses)) {
          analysis.weaknesses = [];
        }

        if (!Array.isArray(analysis.red_flags)) {
          analysis.red_flags = [];
        }
      });

      // Validate recommendation confidence
      if (typeof comparisonData.recommendation.confidence !== 'number' || 
          comparisonData.recommendation.confidence < 0 || 
          comparisonData.recommendation.confidence > 1) {
        comparisonData.recommendation.confidence = 0.8; // Default confidence
      }

      return comparisonData;
    } catch (error) {
      console.error('Error comparing proposals:', error);
      throw error;
    }
  }
}

export default AIService;
