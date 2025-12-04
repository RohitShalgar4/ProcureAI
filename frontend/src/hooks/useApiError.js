import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API errors with retry functionality
 */
export const useApiError = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Handle API error and extract user-friendly message
   */
  const handleError = useCallback((err) => {
    console.error('API Error:', err);

    // Use formatted error from interceptor if available
    if (err.formattedError) {
      setError(err.formattedError);
      return err.formattedError;
    }

    // Fallback error handling
    const errorMessage = err.response?.data?.error?.message 
      || err.message 
      || 'An unexpected error occurred';

    const errorInfo = {
      message: errorMessage,
      code: err.response?.data?.error?.code || 'UNKNOWN_ERROR',
      details: err.response?.data?.error?.details || null,
      status: err.response?.status,
    };

    setError(errorInfo);
    return errorInfo;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry a failed operation
   */
  const retry = useCallback(async (operation) => {
    setIsRetrying(true);
    clearError();

    try {
      const result = await operation();
      setIsRetrying(false);
      return result;
    } catch (err) {
      setIsRetrying(false);
      handleError(err);
      throw err;
    }
  }, [handleError, clearError]);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((err) => {
    if (err.formattedError) {
      return err.formattedError.message;
    }
    return err.response?.data?.error?.message 
      || err.message 
      || 'An unexpected error occurred';
  }, []);

  return {
    error,
    handleError,
    clearError,
    retry,
    isRetrying,
    getErrorMessage,
  };
};

export default useApiError;
