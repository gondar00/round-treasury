-- CreateIndex
CREATE UNIQUE INDEX "report_user_id_report_type_period_key" ON "report"("user_id", "report_type", "period");
