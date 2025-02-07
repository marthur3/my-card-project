'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';

export function AuthTest() {
  const { data: session } = useSession();
  const [testResult, setTestResult] = useState<string>('');

  const testAuth = async () => {
    try {
      const res = await fetch('/api/auth/test');
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult('Test failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <h2 className="text-lg font-bold">Auth Test Panel</h2>
      <div>Session Status: {session ? '✅ Authenticated' : '❌ Not authenticated'}</div>
      <Button onClick={testAuth}>Test Auth API</Button>
      {testResult && (
        <pre className="bg-gray-100 p-2 rounded">
          {testResult}
        </pre>
      )}
    </div>
  );
}
