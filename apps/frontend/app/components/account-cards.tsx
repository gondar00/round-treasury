'use client';

interface Account {
  id: string;
  name: string;
  type: string;
  mask: string | null;
  currentBalance: number | null;
  currency: string | null;
  lastSyncedAt: string | null;
  plaidItem: { institutionName: string | null };
}

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never synced';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function AccountCards({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No accounts linked yet. Click "Link bank account" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="border border-border rounded-lg p-4 bg-card space-y-2"
        >
          <p className="text-sm font-medium text-primary">
            {account.plaidItem.institutionName || 'Unknown Bank'}
          </p>
          <p className="text-xl font-bold">
            £{(account.currentBalance || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {account.name} {account.mask ? `(**${account.mask})` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            ⟳ {formatTimeAgo(account.lastSyncedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
