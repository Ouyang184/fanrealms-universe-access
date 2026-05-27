UPDATE public.creators SET platform_fee_rate = 5 WHERE platform_fee_rate IS NULL OR platform_fee_rate < 1 OR platform_fee_rate > 5;
ALTER TABLE public.creators ADD CONSTRAINT platform_fee_rate_range CHECK (platform_fee_rate BETWEEN 1 AND 5) NOT VALID;
ALTER TABLE public.creators VALIDATE CONSTRAINT platform_fee_rate_range;