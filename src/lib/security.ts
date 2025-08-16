/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate invoice number format
 */
export const isValidInvoiceNumber = (invoiceNumber: string): boolean => {
  // Allow alphanumeric characters, hyphens, and underscores
  const invoiceRegex = /^[A-Za-z0-9\-_]+$/;
  return invoiceRegex.test(invoiceNumber) && invoiceNumber.length >= 1 && invoiceNumber.length <= 50;
};

/**
 * Sanitize currency amount
 */
export const sanitizeCurrencyAmount = (amount: string | number): number => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  
  if (isNaN(numericAmount) || numericAmount < 0) {
    return 0;
  }
  
  // Round to 2 decimal places for currency
  return Math.round(numericAmount * 100) / 100;
};

/**
 * Validate and sanitize text input
 */
export const sanitizeTextInput = (input: string, maxLength = 1000): string => {
  if (!input) return '';
  
  return sanitizeInput(input).slice(0, maxLength);
};

/**
 * Rate limiting helper (client-side only - server-side should be implemented separately)
 */
export class ClientRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  canAttempt(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const authRateLimiter = new ClientRateLimiter();