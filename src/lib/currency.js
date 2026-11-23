import { prisma } from '@/lib/prisma';

// Server-side currency conversion with a Postgres-backed rate cache (#81).
// Rates come from Frankfurter v2 (https://frankfurter.dev/) — no API key.
// Same-currency conversion is identity and never hits the provider.
// The provider boundary lives here so the cache can move to Redis later
// without changing report callers.

const PROVIDER = 'frankfurter';
const FRANKFURTER_BASE = process.env.FX_PROVIDER_URL || 'https://api.frankfurter.app';
const FRANKFURTER_LATEST = `${FRANKFURTER_BASE}/latest`;
const FRANKFURTER_HISTORICAL = FRANKFURTER_BASE;
class ExchangeRateError extends Error {}

// Convert amount -> target currency using the rate for the given date.
// `date` is only used to pick the historical rate: past payments convert at
// their own payment date. Returns identity amount for same currency.
const convertAmount = async (amount, base, quote, date = undefined) => {
  if (base === quote) {
    return { amount, converted: true, rate: 1, rateDate: null, source: 'identity' };
  }

  // 1) Cache lookup for this date/currency pair
  const day = date ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) : null;
  if (day) {
    const cached = await prisma.exchangeRateCache.findFirst({
      where: { baseCurrency: base, quoteCurrency: quote, rateDate: day, provider: PROVIDER },
      orderBy: { fetchedAt: 'desc' },
    });
    if (cached) {
      return { amount: amount * cached.rate, converted: true, rate: cached.rate, rateDate: cached.rateDate, source: 'cache' };
    }
  } else {
    // No date: latest cached rate is acceptable
    const cached = await prisma.exchangeRateCache.findFirst({
      where: { baseCurrency: base, quoteCurrency: quote, provider: PROVIDER },
      orderBy: { rateDate: 'desc' },
    });
    if (cached) {
      return { amount: amount * cached.rate, converted: true, rate: cached.rate, rateDate: cached.rateDate, source: 'cache' };
    }
  }

  // 2) Fetch from Frankfurter
  try {
    const url = day
      ? `${FRANKFURTER_HISTORICAL}/${day.toISOString().slice(0, 10)}?from=${base}&to=${quote}`
      : `${FRANKFURTER_LATEST}?from=${base}&to=${quote}`;

    // 3) Fetch with a timeout; the persisted rate is reused later.
    const response = await Promise.race([
      fetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new ExchangeRateError('timeout')), 8000)),
    ]);
    if (!response.ok) {
      throw new ExchangeRateError(`status ${response.status}`);
    }
    const data = await response.json();
    const rate = data?.rates?.[quote];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new ExchangeRateError('invalid rate payload');
    }
    const rateDate = data.date ? new Date(`${data.date}T00:00:00.000Z`) : (day || new Date());
    if (Number.isNaN(rateDate.getTime())) {
      throw new ExchangeRateError('invalid rate date');
    }

    await prisma.exchangeRateCache.upsert({
      where: {
        baseCurrency_quoteCurrency_rateDate_provider: {
          baseCurrency: base,
          quoteCurrency: quote,
          rateDate,
          provider: PROVIDER,
        },
      },
      create: { baseCurrency: base, quoteCurrency: quote, rateDate, rate, provider: PROVIDER },
      update: { rate, fetchedAt: new Date() },
    }).catch(() => { /* cache write failure must not fail the report */ });

    return { amount: amount * rate, converted: true, rate, rateDate, source: 'frankfurter' };
  } catch (error) {
    // 4) Provider failure: fall back to any cached rate for this pair
    const fallback = await prisma.exchangeRateCache.findFirst({
      where: { baseCurrency: base, quoteCurrency: quote, provider: PROVIDER },
      orderBy: { rateDate: 'desc' },
    });
    if (fallback) {
      return { amount: amount * fallback.rate, converted: true, rate: fallback.rate, rateDate: fallback.rateDate, source: 'cache-fallback' };
    }

    // 5) No cached rate: keep the original amount, labeled unconverted
    return { amount, converted: false, rate: null, rateDate: null, source: 'unconverted' };
  }
};

export { convertAmount, PROVIDER };
