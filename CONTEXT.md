# Round Treasury

A treasury dashboard that aggregates bank accounts, transactions, and financial stats for business founders and executives.

## Language

**Account**:
A bank account connected via an open banking provider. Has a balance, type, and belongs to an institution.
_Avoid_: Wallet, bank

**Transaction**:
An individual spend or credit on a single account. Positive amount = money leaving the account (expense); negative amount = money entering (income). This follows Plaid's sign convention.
_Avoid_: Payment, transfer

**Report**:
A precomputed financial metric for a given period. Types: runway, monthly spend, monthly income.
_Avoid_: Stat, metric, analytics

**Runway**:
Expected time until total balance reaches zero, based on average net burn.
_Avoid_: Burn rate (that's the input, not the output)

**Plaid Item**:
A persistent connection to a financial institution via Plaid. Holds the access token and sync cursor.
_Avoid_: Connection, link (overloaded with Plaid Link the UI component)

**Sync**:
The process of fetching latest account and transaction data from Plaid and upserting it locally.
_Avoid_: Refresh, update (too generic)
