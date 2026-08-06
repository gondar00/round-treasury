-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('monthly_spend', 'monthly_income', 'runway');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaid_item" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "institution_id" TEXT,
    "institution_name" TEXT,
    "cursor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plaid_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plaid_item_id" TEXT NOT NULL,
    "plaid_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "official_name" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "mask" TEXT,
    "current_balance" DOUBLE PRECISION,
    "available_balance" DOUBLE PRECISION,
    "currency" TEXT,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "plaid_transaction_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "merchant_name" TEXT,
    "category" TEXT,
    "payment_channel" TEXT,
    "pending" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "period" TIMESTAMPTZ NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "change_percentage" DOUBLE PRECISION,
    "currency" TEXT,
    "unit" TEXT,
    "cash_zero_date" TIMESTAMPTZ,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plaid_item_item_id_key" ON "plaid_item"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_plaid_account_id_key" ON "account"("plaid_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_plaid_transaction_id_key" ON "transaction"("plaid_transaction_id");

-- AddForeignKey
ALTER TABLE "plaid_item" ADD CONSTRAINT "plaid_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_plaid_item_id_fkey" FOREIGN KEY ("plaid_item_id") REFERENCES "plaid_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
