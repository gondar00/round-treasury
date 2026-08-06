'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

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

interface Account {
  id: string;
  name: string;
  mask: string | null;
  plaidItem: { institutionName: string | null };
}

const columnHelper = createColumnHelper<Transaction>();

export function TransactionsTable({
  transactions,
  accounts,
}: {
  transactions: Transaction[];
  accounts: Account[];
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [accountFilter, setAccountFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (accountFilter) {
      filtered = filtered.filter(
        (tx) => `${tx.account.name} ${tx.account.mask ? `(**${tx.account.mask})` : ''}` === accountFilter
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((tx) => tx.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((tx) => tx.date <= dateTo);
    }

    return filtered;
  }, [transactions, accountFilter, dateFrom, dateTo]);

  const accountOptions = useMemo(() => {
    const seen = new Set<string>();
    return accounts.map((acc) => {
      const label = `${acc.name} ${acc.mask ? `(**${acc.mask})` : ''}`;
      if (seen.has(label)) return null;
      seen.add(label);
      return label;
    }).filter(Boolean) as string[];
  }, [accounts]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        sortingFn: 'datetime',
      }),
      columnHelper.accessor((row) => row.merchantName || row.name, {
        id: 'merchant',
        header: 'To/From',
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const amount = info.getValue();
          return (
            <span className={amount > 0 ? 'text-red-600' : 'text-green-600'}>
              £{Math.abs(amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
          );
        },
      }),
      columnHelper.accessor('paymentChannel', {
        header: 'Payment Method',
        cell: (info) => (
          <span className="capitalize">{info.getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor((row) => row.account.plaidItem.institutionName || '-', {
        id: 'bank',
        header: 'Bank',
      }),
      columnHelper.accessor(
        (row) => `${row.account.name} ${row.account.mask ? `(**${row.account.mask})` : ''}`,
        {
          id: 'account',
          header: 'Account',
        }
      ),
    ],
    []
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

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

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
        >
          <option value="">All accounts</option>
          {accountOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
        />

        {(accountFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setAccountFilter(''); setDateFrom(''); setDateTo(''); }}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`p-3 font-medium text-left cursor-pointer select-none hover:bg-muted/80 ${
                      header.id === 'amount' ? 'text-right' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`p-3 ${cell.column.id === 'amount' ? 'text-right' : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredTransactions.length
          )}{' '}
          of {filteredTransactions.length} transactions
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-border rounded-md disabled:opacity-50 hover:bg-secondary/50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-border rounded-md disabled:opacity-50 hover:bg-secondary/50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
