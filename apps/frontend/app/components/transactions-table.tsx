'use client';

interface Transaction {
  id: string;
  amount: number;
  currency: string | null;
  date: string;
  name: string;
  merchantName: string | null;
  paymentChannel: string | null;
  account: {
    name: string;
    mask: string | null;
    plaidItem: { institutionName: string | null };
  };
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Transactions</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">To/From</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Payment Method</th>
              <th className="text-left p-3 font-medium">Bank</th>
              <th className="text-left p-3 font-medium">Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border">
                <td className="p-3">
                  {new Date(tx.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-3">{tx.merchantName || tx.name}</td>
                <td className={`p-3 text-right ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.amount < 0 ? '-' : ''}£{Math.abs(tx.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 capitalize">{tx.paymentChannel || '-'}</td>
                <td className="p-3">{tx.account.plaidItem.institutionName || '-'}</td>
                <td className="p-3">
                  {tx.account.name} {tx.account.mask ? `(**${tx.account.mask})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
