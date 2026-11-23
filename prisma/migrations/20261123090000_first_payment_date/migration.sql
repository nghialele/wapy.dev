-- Add first_payment_date to Subscription (#105)
ALTER TABLE "Subscription" ADD COLUMN "first_payment_date" TIMESTAMP(3);

