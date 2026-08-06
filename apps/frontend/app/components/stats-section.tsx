'use client';

import { BarChart, Bar, LineChart, Line, ResponsiveContainer } from 'recharts';

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

export function StatsSection({ reports }: { reports: Report[] }) {
  const runwayReports = reports.filter((r) => r.reportType === 'runway');
  const spendReports = reports.filter((r) => r.reportType === 'monthly_spend');
  const incomeReports = reports.filter((r) => r.reportType === 'monthly_income');

  const latestRunway = runwayReports[0];
  const latestSpend = spendReports[0];
  const latestIncome = incomeReports[0];

  const formatRunway = (months: number | undefined) => {
    if (!months) return 'N/A';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  const spendChartData = spendReports
    .slice(0, 8)
    .reverse()
    .map((r) => ({
      period: new Date(r.period).toLocaleDateString('en-GB', { month: 'short' }),
      value: r.value,
    }));

  const incomeChartData = incomeReports
    .slice(0, 8)
    .reverse()
    .map((r) => ({
      period: new Date(r.period).toLocaleDateString('en-GB', { month: 'short' }),
      value: r.value,
    }));

  const runwayChartData = runwayReports
    .slice(0, 8)
    .reverse()
    .map((r) => ({
      period: new Date(r.period).toLocaleDateString('en-GB', { month: 'short' }),
      value: r.value,
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border border-border rounded-lg p-4 bg-card space-y-2">
        <p className="text-sm text-muted-foreground">Runway & Cash Zero</p>
        <p className="text-2xl font-bold">{formatRunway(latestRunway?.value)}</p>
        {latestRunway?.cashZeroDate && (
          <p className="text-xs text-muted-foreground">
            {new Date(latestRunway.cashZeroDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        {runwayChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={runwayChartData}>
              <Line type="monotone" dataKey="value" stroke="hsl(240, 5.9%, 10%)" strokeWidth={2} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border border-border rounded-lg p-4 bg-card space-y-2">
        <p className="text-sm text-muted-foreground">Monthly spend</p>
        <p className="text-2xl font-bold">
          £{(latestSpend?.value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
        {latestSpend?.changePercentage != null && (
          <p className="text-xs text-muted-foreground">
            {latestSpend.changePercentage >= 0 ? '+' : ''}{latestSpend.changePercentage}% from last month
          </p>
        )}
        {spendChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={spendChartData}>
              <Bar dataKey="value" fill="hsl(240, 5.9%, 10%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border border-border rounded-lg p-4 bg-card space-y-2">
        <p className="text-sm text-muted-foreground">Monthly income</p>
        <p className="text-2xl font-bold">
          £{(latestIncome?.value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
        {latestIncome?.changePercentage != null && (
          <p className="text-xs text-muted-foreground">
            {latestIncome.changePercentage >= 0 ? '+' : ''}{latestIncome.changePercentage}% from last month
          </p>
        )}
        {incomeChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={incomeChartData}>
              <Bar dataKey="value" fill="hsl(240, 5.9%, 10%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
