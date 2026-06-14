import Groq from 'groq-sdk';

/**
 * LLM Helper for categorizing customer support messages
 * Using Groq API for AI-powered categorization with subcategory support
 */

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
});

const DEFAULT_CATEGORY = 'Unknown'
const DEFAULT_SUBCATEGORY = 'General'

/**
 * Categorize a customer support message using Groq AI
 *
 * @param {string} message - The customer support message
 * @returns {Promise<{category: string, subcategory: string, urgency: string, reasoning: string}>}
 */
export async function categorizeMessage(message) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a customer support triage assistant. Classify messages into a primary category, detailed subcategory, and urgency level.

Primary Categories:
- Billing Issue
- Technical Problem
- General Inquiry
- Feature Request

Subcategories by Primary Category:
Billing Issue: Payment Processing Issues, Refund Request, Invoice Question, Subscription Cancellation, Account Billing
Technical Problem: Application/Website Error, Performance Issue, System Outage, Bug Report, IT/Technical Support, Website/Platform Issues
General Inquiry: Customer Feedback/Appreciation, Customer Question, Account Help, How-To Question
Feature Request: Feature Request, Enhancement Suggestion, Product Improvement

Urgency Assessment Guidelines:
HIGH: Production outages, critical system failures, security issues, payment processing failures, data loss, angry customers, explicit emergency language
MEDIUM: Non-critical technical issues, billing problems, feature requests with business impact, frustrated customers, escalation requests
LOW: General questions, feature requests, positive feedback, minor issues, informational requests

Return detailed reasoning referencing specific keywords, sentiment, and business impact.`
        },
        {
          role: 'user',
          content: `Classify this customer support message: "${message}"

Return only valid JSON in this exact shape:
{
  "category": "Primary Category Name",
  "subcategory": "Detailed Subcategory Name",
  "urgency": "High|Medium|Low",
  "reasoning": "Detailed reasoning explaining the classification, business impact, and urgency assessment."
}`
        }
      ]
    });

    const content = response.choices?.[0]?.message?.content?.trim() || ''
    const parsed = parseCategorizationResponse(content)

    return {
      category: parsed.category || DEFAULT_CATEGORY,
      subcategory: parsed.subcategory || DEFAULT_SUBCATEGORY,
      urgency: parsed.urgency || 'Medium',
      reasoning: parsed.reasoning || content
    }
  } catch (error) {
    console.warn('Groq API failed, using mock response:', error.message)
    return getMockCategorization(message)
  }
}

function parseCategorizationResponse(content) {
  const parsedJson = extractJsonObject(content)
  if (parsedJson) {
    try {
      return JSON.parse(parsedJson)
    } catch (error) {
      // Fall back to line parsing if JSON is malformed
    }
  }

  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const data = {
    category: DEFAULT_CATEGORY,
    subcategory: DEFAULT_SUBCATEGORY,
    urgency: 'Medium',
    reasoning: content
  }

  lines.forEach(line => {
    const categoryMatch = line.match(/^category\s*[:\-]\s*(.+)$/i)
    const subcategoryMatch = line.match(/^subcategory\s*[:\-]\s*(.+)$/i)
    const urgencyMatch = line.match(/^urgency\s*[:\-]\s*(.+)$/i)
    const reasoningMatch = line.match(/^reasoning\s*[:\-]\s*(.+)$/i)

    if (categoryMatch) data.category = categoryMatch[1].trim()
    if (subcategoryMatch) data.subcategory = subcategoryMatch[1].trim()
    if (urgencyMatch) data.urgency = urgencyMatch[1].trim()
    if (reasoningMatch) data.reasoning = reasoningMatch[1].trim()
  })

  return data
}

function extractJsonObject(text) {
  const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeFenceMatch) {
    return codeFenceMatch[1].trim()
  }

  const braceMatch = text.match(/(\{[\s\S]*\})/)
  return braceMatch ? braceMatch[1].trim() : null
}

/**
 * Mock categorization for when API is unavailable
 */
function getMockCategorization(message) {
  const lowerMessage = message.toLowerCase()

  const reasoningVariations = {
    billing: [
      'Based on keywords related to payments and billing, this appears to be a billing-related inquiry. The customer may need assistance with account charges or payment issues.',
      'This message contains billing terminology. The customer is likely experiencing issues with payments, invoices, or account charges.',
      'The message references financial matters related to the customer\'s account. This suggests a billing or payment concern that requires attention.'
    ],
    technical: [
      'This message describes technical difficulties or system errors. The customer is reporting functionality issues that may require engineering review.',
      'Based on error-related keywords, this appears to be a technical support issue. The customer is experiencing problems with product functionality.',
      'The message indicates a technical problem or bug. This requires investigation from the technical support team.',
      'System-related issues are mentioned in this message. The customer needs technical assistance to resolve functionality problems.'
    ],
    feature: [
      'This message suggests improvements or new functionality. The customer is providing product feedback and feature suggestions.',
      'The customer is requesting enhancements to the product. This appears to be a feature request that should be reviewed by the product team.',
      'Based on the language used, this seems to be a suggestion for product improvements rather than a support issue.'
    ],
    inquiry: [
      'This appears to be a general question about the product or service. The customer is seeking information or clarification.',
      'The message contains questions that don\'t indicate a specific problem. This is likely a general inquiry requiring informational support.',
      'Based on the question format, this seems to be an information request rather than a technical or billing issue.'
    ],
    positive: [
      'This message contains positive sentiment and appreciation. While not a support request, it may warrant acknowledgment.',
      'The customer is expressing satisfaction or gratitude. This doesn\'t appear to require immediate support action.'
    ],
    ambiguous: [
      'The message content is unclear or doesn\'t match standard support categories. Manual review may be needed for proper categorization.',
      'This message doesn\'t contain clear indicators for automatic categorization. Human review recommended.'
    ]
  }

  const getRandomReasoning = (category) => {
    const reasons = reasoningVariations[category]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  const assessUrgency = (category) => {
    // Production/critical issues
    if (lowerMessage.includes('production') || lowerMessage.includes('down') || 
        lowerMessage.includes('outage') || lowerMessage.includes('critical') ||
        lowerMessage.includes('emergency') || lowerMessage.includes('broken') ||
        lowerMessage.includes('crash') || lowerMessage.includes('security')) {
      return 'High'
    }

    // Payment processing failures
    if (category === 'Billing Issue' && 
        (lowerMessage.includes('payment') || lowerMessage.includes('transaction'))) {
      return 'High'
    }

    // Frustrated customers or escalations
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') ||
        lowerMessage.includes('immediately') || lowerMessage.includes('frustrated') ||
        lowerMessage.includes('angry') || lowerMessage.includes('unacceptable') ||
        (lowerMessage.match(/!/g) || []).length >= 2) {
      return 'High'
    }

    // Medium urgency: Technical issues, billing problems, feature requests
    if (category === 'Technical Problem' || 
        (category === 'Billing Issue' && !lowerMessage.includes('question')) ||
        (lowerMessage.includes('error') && category === 'Technical Problem')) {
      return 'Medium'
    }

    // Medium for confused/frustrated general inquiries
    if (category === 'General Inquiry' && 
        (lowerMessage.includes('help') || lowerMessage.includes('problem') ||
         lowerMessage.includes('issue') || lowerMessage.includes('confused'))) {
      return 'Medium'
    }

    // Low urgency: Feature requests, positive feedback, general questions
    if (category === 'Feature Request' || category === 'General Inquiry') {
      return 'Low'
    }

    return 'Medium'
  }

  const getSubcategory = (category) => {
    if (category === 'Billing Issue') {
      if (lowerMessage.includes('refund')) return 'Refund Request'
      if (lowerMessage.includes('invoice')) return 'Invoice Question'
      if (lowerMessage.includes('cancel')) return 'Subscription Cancellation'
      if (lowerMessage.includes('payment') || lowerMessage.includes('charge')) return 'Payment Processing Issues'
      return 'Account Billing'
    }

    if (category === 'Technical Problem') {
      if (lowerMessage.includes('crash') || lowerMessage.includes('bug')) return 'Bug Report'
      if (lowerMessage.includes('slow') || lowerMessage.includes('loading') || lowerMessage.includes('timeout')) return 'Performance Issue'
      if (lowerMessage.includes('server') || lowerMessage.includes('down')) return 'System Outage'
      if (lowerMessage.includes('error')) return 'Application/Website Error'
      if (lowerMessage.includes('dashboard') || lowerMessage.includes('page') || lowerMessage.includes('website')) return 'Website/Platform Issues'
      return 'IT/Technical Support'
    }

    if (category === 'Feature Request') {
      if (lowerMessage.includes('suggest') || lowerMessage.includes('suggestion')) return 'Enhancement Suggestion'
      if (lowerMessage.includes('improve')) return 'Product Improvement'
      return 'Feature Request'
    }

    if (category === 'General Inquiry') {
      if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
        return 'Customer Feedback/Appreciation'
      }
      if (lowerMessage.includes('how') || lowerMessage.includes('help')) return 'How-To Question'
      if (lowerMessage.includes('account')) return 'Account Help'
      return 'Customer Question'
    }

    return 'Manual Review'
  }

  if (lowerMessage.includes('bill') || lowerMessage.includes('payment') ||
      lowerMessage.includes('charge') || lowerMessage.includes('invoice') ||
      lowerMessage.includes('credit card') || lowerMessage.includes('subscription') ||
      lowerMessage.includes('refund') || (lowerMessage.includes('cancel') && lowerMessage.includes('account'))) {
    const subcategory = getSubcategory('Billing Issue')
    return {
      category: 'Billing Issue',
      subcategory,
      urgency: assessUrgency('Billing Issue'),
      reasoning: getRandomReasoning('billing')
    }
  }

  if (lowerMessage.includes('bug') || lowerMessage.includes('error') ||
      lowerMessage.includes('broken') || lowerMessage.includes('not working') ||
      lowerMessage.includes('crash') || lowerMessage.includes('down') ||
      lowerMessage.includes('server') || lowerMessage.includes('loading') ||
      lowerMessage.includes('slow') || lowerMessage.includes('issue') ||
      (lowerMessage.includes('problem') && !lowerMessage.includes('no problem'))) {
    const subcategory = getSubcategory('Technical Problem')
    return {
      category: 'Technical Problem',
      subcategory,
      urgency: assessUrgency('Technical Problem'),
      reasoning: getRandomReasoning('technical')
    }
  }

  if (lowerMessage.includes('feature') || (lowerMessage.includes('add') && (lowerMessage.includes('please') || lowerMessage.includes('could'))) ||
      lowerMessage.includes('improve') || lowerMessage.includes('would like to see') ||
      lowerMessage.includes('suggestion') || lowerMessage.includes('wish') ||
      (lowerMessage.includes('could you') && lowerMessage.includes('add')) ||
      lowerMessage.includes('enhancement') || lowerMessage.includes('would be great')) {
    const subcategory = getSubcategory('Feature Request')
    return {
      category: 'Feature Request',
      subcategory,
      urgency: assessUrgency('Feature Request'),
      reasoning: getRandomReasoning('feature')
    }
  }

  if ((lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) &&
      !lowerMessage.includes('but') && !lowerMessage.includes('however')) {
    return {
      category: 'General Inquiry',
      subcategory: getSubcategory('General Inquiry'),
      urgency: 'Low',
      reasoning: getRandomReasoning('positive')
    }
  }

  if (lowerMessage.includes('how') || lowerMessage.includes('what') ||
      lowerMessage.includes('when') || lowerMessage.includes('where') ||
      lowerMessage.includes('can i') || lowerMessage.includes('is there') ||
      lowerMessage.includes('?')) {
    const subcategory = getSubcategory('General Inquiry')
    return {
      category: 'General Inquiry',
      subcategory,
      urgency: assessUrgency('General Inquiry'),
      reasoning: getRandomReasoning('inquiry')
    }
  }

  return {
    category: 'General Inquiry',
    subcategory: 'Customer Question',
    urgency: 'Medium',
    reasoning: getRandomReasoning('ambiguous')
  }
}
