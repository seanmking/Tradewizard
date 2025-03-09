import axios from 'axios';

/**
 * Handle API errors consistently across the application
 * 
 * @param error The error from an API call
 * @param defaultMessage Default message to display if error is not recognized
 * @returns A promise that rejects with a formatted error message
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'An unexpected error occurred'): never => {
  console.error(`API Error:`, error);
  
  // Extract message if possible
  let errorMessage = defaultMessage;
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if ('response' in error && 
              error.response && 
              typeof error.response === 'object' && 
              'data' in error.response && 
              error.response.data && 
              typeof error.response.data === 'object' && 
              'message' in error.response.data && 
              typeof error.response.data.message === 'string') {
      errorMessage = error.response.data.message;
    }
  }
  
  throw new Error(errorMessage);
}; 