import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const RazorpayTest = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRazorpayConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-razorpay');
      
      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult(data);
      }
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Razorpay Configuration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testRazorpayConfig} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Razorpay Config'}
        </Button>
        
        {testResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Test Result:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RazorpayTest;

