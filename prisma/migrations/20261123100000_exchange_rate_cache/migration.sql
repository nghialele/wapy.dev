-- Add exchange rate cache table (#81)
CREATE TABLE "exchange_rate_cache" (
    "id" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL,
    "quote_currency" TEXT NOT NULL,
    "rate_date" DATE NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRateCache_base_currency_quote_currency_rate_date_provider_key" ON "exchange_rate_cache"("base_currency", "quote_currency", "rate_date", "provider");

-- CreateIndex
CREATE INDEX "ExchangeRateCache_base_currency_quote_currency_idx" ON "exchange_rate_cache"("base_currency", "quote_currency");
