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
      const firstError = json.errors?.length ? ` · ${json.errors[0]}` : '';
      setMessage(`Updated ${json.updated}, skipped ${json.skipped}${json.errors?.length ? `, ${json.errors.length} errors${firstError}` : ''}`);
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
        className="px-5 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: state === 'loading' ? '#E4E4E7' : 'var(--dark)',
          color: state === 'loading' ? 'var(--muted)' : '#fff',
        }}
      >
        {state === 'loading' ? 'Refreshing…' : 'Refresh Signals'}
      </button>
      {message && (
        <span className={`text-xs font-medium ${state === 'error' ? 'text-rose-500' : 'text-zinc-500'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
