'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function LinkAccountButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const createLinkToken = async () => {
    const res = await fetch(`${API_BASE}/api/integrations/plaid/create-link-token`, {
      method: 'POST',
    });
    const data = await res.json();
    setLinkToken(data.link_token);
  };

  const onPlaidSuccess = useCallback(
    async (publicToken: string | null, _metadata: PlaidLinkOnSuccessMetadata) => {
      if (!publicToken) return;
      await fetch(`${API_BASE}/api/integrations/plaid/exchange-public-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });
      onSuccess();
    },
    [onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <button
      onClick={createLinkToken}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      + Link bank account
    </button>
  );
}
