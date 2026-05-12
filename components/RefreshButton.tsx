'use client';

import { useState } from 'react';

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleRefresh() {
    setState('loading');
    setMessage('');
    try {
      const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;
      const headers: Record<string, string> = {};
      if (cronSecret) headers['Authorization'] = `Bearer ${cronSecret}`;
      const res = await fetch('/api/refresh', { method: 'POST', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Refresh failed');
      setMessage(`Updated ${json.updated}, skipped ${json.skipped}${json.errors?.length ? `, ${json.errors.length} errors` : ''}`);
      setState('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
      setState('error');
    }
    setTimeout(() => setState('idle'), 8000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={state === 'loading'}
        className="px-4 py-1.5 text-sm font-medium rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {state === 'loading' ? 'Refreshing…' : 'Refresh Signals'}
      </button>
      {message && (
        <span className={`text-xs ${state === 'error' ? 'text-rose-400' : 'text-slate-400'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
