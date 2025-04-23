'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [cookieInfo, setCookieInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function checkAuthState() {
      try {
        console.log('[DEBUG-PAGE] Checking auth state');
        const supabase = createClient();
        
        // Get session info
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('[DEBUG-PAGE] Session data:', sessionData);
        
        if (sessionError) {
          console.error('[DEBUG-PAGE] Session error:', sessionError);
          setError(`Session error: ${sessionError.message}`);
        }
        
        // Get user info
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('[DEBUG-PAGE] User data:', userData);
        
        if (userError) {
          console.error('[DEBUG-PAGE] User error:', userError);
          setError((prev) => `${prev || ''}\nUser error: ${userError.message}`);
        }
        
        // Get all cookies
        const cookieString = document.cookie;
        const cookies = cookieString.split(';').map(cookie => cookie.trim());
        setCookieInfo(cookies);
        
        // Debug information to help troubleshoot
        setDebugInfo({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          hasUser: !!userData?.user,
          hasSession: !!sessionData?.session,
          cookieCount: cookies.length,
          authTokenPresent: cookies.some(c => c.includes('auth-token')),
          headerTest: await fetch('/api/auth-check').then(r => r.text()).catch(e => `Error: ${e}`)
        });
        
        // Set user info for display
        setUserInfo({
          session: sessionData,
          user: userData,
          localStorage: Object.keys(localStorage).reduce((obj, key) => {
            if (key.includes('supabase') || key.includes('auth')) {
              obj[key] = localStorage.getItem(key)?.substring(0, 50) + '...';
            }
            return obj;
          }, {} as Record<string, string>)
        });
      } catch (err: any) {
        console.error('[DEBUG-PAGE] Unexpected error:', err);
        setError(`Unexpected error: ${err.message}`);
      }
    }
    
    checkAuthState();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>
      
      {error && (
        <div className="bg-red-100 p-4 mb-4 rounded text-red-700">
          <pre>{error}</pre>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Quick Links</h2>
        <div className="flex gap-4 mb-4">
          <Link href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go to Dashboard
          </Link>
          <Link href="/login" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Go to Login
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>Authenticated: {userInfo?.user?.user ? 'Yes' : 'No'}</p>
          {userInfo?.user?.user && (
            <>
              <p>User ID: {userInfo.user.user.id}</p>
              <p>Email: {userInfo.user.user.email}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Session Information</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto">
          <pre>{JSON.stringify(userInfo?.session, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        <div className="bg-gray-100 p-4 rounded">
          <ul>
            {cookieInfo.map((cookie, index) => (
              <li key={index} className="mb-1">{cookie}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Local Storage</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto">
          <pre>{JSON.stringify(userInfo?.localStorage, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Actions</h2>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.refreshSession();
              window.location.reload();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Refresh Session
          </button>
        </div>
      </div>
    </div>
  );
}