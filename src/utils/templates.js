/**
 * Recommendation Templates - Maps categories and subcategories to recommended actions
 */

const actionTemplates = {
  'Billing Issue': {
    default: 'Escalate to billing support team.',
    'Payment Processing Issues': 'Verify payment details, check if card is valid, and suggest retrying or updating payment method.',
    'Refund Request': 'Confirm refund eligibility, process refund if applicable, and provide refund timeline.',
    'Invoice Question': 'Provide detailed invoice breakdown and clarify billing dates and charges.',
    'Subscription Cancellation': 'Confirm cancellation intent, explain consequences, and process if customer confirms.',
    'Account Billing': 'Review account billing status and reconcile any discrepancies.'
  },
  'Technical Problem': {
    default: 'Route to technical support team for investigation.',
    'Application/Website Error': 'Collect error details, logs if available, and escalate to engineering.',
    'Performance Issue': 'Recommend clearing cache, checking network, and trying a different browser or device.',
    'System Outage': 'Check status page, notify user of known outage, and provide ETA if available.',
    'Bug Report': 'Log issue in bug tracking system and escalate to development team for reproduction.',
    'IT/Technical Support': 'Provide troubleshooting steps and escalate if issue persists.',
    'Website/Platform Issues': 'Check platform status and provide alternate access method if available.'
  },
  'General Inquiry': {
    default: 'Provide helpful information or direct to relevant resources.',
    'Customer Feedback/Appreciation': 'Thank customer for feedback, acknowledge their concerns or praise, and document sentiment.',
    'Customer Question': 'Answer question directly with relevant documentation or provide clear explanation.',
    'Account Help': 'Guide customer through account management steps or escalate if additional access needed.',
    'How-To Question': 'Provide step-by-step guidance or link to relevant tutorial or documentation.'
  },
  'Feature Request': {
    default: 'Capture request details and forward to product team.',
    'Feature Request': 'Document feature request, capture use case, and add to product backlog.',
    'Enhancement Suggestion': 'Acknowledge suggestion, document improvement area, and share with product team.',
    'Product Improvement': 'Evaluate suggestion for feasibility and add to product roadmap considerations.'
  },
  'Unknown': {
    default: 'Review manually.'
  }
}

/**
 * Get recommended action for a given category and subcategory
 *
 * @param {string} category - The message category
 * @param {string} subcategory - The message subcategory
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, subcategory) {
  const categoryTemplate = actionTemplates[category] || actionTemplates['Unknown']
  return (subcategory && categoryTemplate[subcategory])
    ? categoryTemplate[subcategory]
    : categoryTemplate.default || 'No recommendation available.'
}

/**
 * Get all available categories
 *
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @param {string} message - The original message
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency, message) {
  return message.length > 100
}
