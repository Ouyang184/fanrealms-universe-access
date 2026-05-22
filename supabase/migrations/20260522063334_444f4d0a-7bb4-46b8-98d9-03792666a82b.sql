
CREATE POLICY "Service role manages 2FA challenges"
ON public.pending_2fa_challenges
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
