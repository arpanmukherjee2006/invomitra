import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentErrorHandlerProps {
  errorType?: 'phonepe' | 'general' | 'invalid_details' | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  isVisible: boolean;
}

const PaymentErrorHandler = ({
  errorType = null,
  onRetry,
  onDismiss,
  isVisible
}: PaymentErrorHandlerProps) => {
  const [alternativeApps, setAlternativeApps] = useState<string[]>([]);

  useEffect(() => {
    // Suggest alternative payment apps when PhonePe fails
    if (errorType === 'phonepe') {
      setAlternativeApps(['Google Pay', 'Paytm', 'Amazon Pay', 'BHIM UPI']);
    }
  }, [errorType]);

  if (!isVisible) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {errorType === 'phonepe' 
          ? 'PhonePe is facing issues' 
          : errorType === 'invalid_details'
          ? 'Invalid Payment Details'
          : 'Payment Failed'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {errorType === 'phonepe' ? (
          <>
            <p>PhonePe is currently experiencing issues. Please try one of these alternatives:</p>
            <ul className="mt-2 list-disc pl-5">
              {alternativeApps.map((app) => (
                <li key={app}>{app}</li>
              ))}
            </ul>
          </>
        ) : errorType === 'invalid_details' ? (
          <p>The payment details provided are invalid. Please check and retry with the correct information.</p>
        ) : (
          <p>Your payment could not be completed. Please try again or use a different payment method.</p>
        )}

        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry Payment
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PaymentErrorHandler;