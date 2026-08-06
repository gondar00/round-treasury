'use client';

import { useEffect, useState } from 'react';
import { AccountCards } from '../components/account-cards';
import { StatsSection } from '../components/stats-section';
import { TransactionsTable } from '../components/transactions-table';
import { LinkAccountButton } from '../components/link-account-button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Account {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currency: string | null;
  lastSyncedAt: string | null;
  plaidItem: { institutionName: string | null };
}

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

interface Report {
  id: string;
  reportType: string;
  period: string;
  value: number;
  changePercentage: number | null;
  currency: string | null;
  unit: string | null;
  cashZeroDate: string | null;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [accountsRes, transactionsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/api/user/accounts`),
        fetch(`${API_BASE}/api/user/transactions`),
        fetch(`${API_BASE}/api/user/reports`),
      ]);

      setAccounts(await accountsRes.json());
      setTransactions(await transactionsRes.json());
      setReports(await reportsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.currentBalance || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Add or manage your linked bank accounts</p>
        </div>
        <LinkAccountButton onSuccess={fetchData} />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Total account balance ({accounts.length} accounts)
        </p>
        <p className="text-4xl font-bold">
          £{totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <AccountCards accounts={accounts} />
      <StatsSection reports={reports} />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
