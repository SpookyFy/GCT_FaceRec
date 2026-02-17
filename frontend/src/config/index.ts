// API Configuration
const DEV_API_URL = 'http://192.168.1.9:8000';  // Use your computer's IP address
const PROD_API_URL = 'http://192.168.1.9:8000';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const API_TIMEOUT = 30000; // 30 seconds

// Add retry configuration
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second 