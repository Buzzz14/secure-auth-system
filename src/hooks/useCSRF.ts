import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Get CSRF token from server
    const getCsrfToken = async () => {
      try {
        const response = await axios.get('/api/csrf-token');
        setCsrfToken(response.data.token);
        
        // Set default headers for all axios requests
        axios.defaults.headers.common['X-CSRF-Token'] = response.data.token;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
      }
    };

    getCsrfToken();
  }, []);

  return csrfToken;
} 