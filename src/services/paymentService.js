// src/services/paymentService.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Generic API call handler
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Search pledges
 */
export const searchPledges = async (searchTerm) => {
  return apiCall(`/pledges/search?q=${encodeURIComponent(searchTerm)}`);
};

/**
 * Get quick access pledges (recent/overdue)
 */
export const getQuickAccessPledges = async () => {
  return apiCall('/pledges/quick-access');
};

/**
 * Get pledge details
 */
export const getPledgeDetails = async (pledgeId) => {
  return apiCall(`/pledges/${pledgeId}`);
};

/**
 * Collect payment
 */
export const collectPayment = async (paymentData) => {
  return apiCall('/payments/collect', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  return apiCall(`/payments/history?${queryParams}`);
};

/**
 * Generate payment receipt
 */
export const generateReceipt = async (paymentId) => {
  return apiCall(`/payments/${paymentId}/receipt`);
};