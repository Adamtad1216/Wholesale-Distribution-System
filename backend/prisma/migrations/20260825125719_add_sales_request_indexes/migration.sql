-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "sales_requests_customer_id_idx" ON "sales_requests"("customer_id");

-- CreateIndex
CREATE INDEX "sales_requests_sales_rep_id_idx" ON "sales_requests"("sales_rep_id");

-- CreateIndex
CREATE INDEX "sales_requests_status_idx" ON "sales_requests"("status");

-- CreateIndex
CREATE INDEX "sales_requests_created_at_idx" ON "sales_requests"("created_at");

-- CreateIndex
CREATE INDEX "sales_requests_customer_id_status_idx" ON "sales_requests"("customer_id", "status");

-- CreateIndex
CREATE INDEX "sales_requests_sales_rep_id_status_idx" ON "sales_requests"("sales_rep_id", "status");
