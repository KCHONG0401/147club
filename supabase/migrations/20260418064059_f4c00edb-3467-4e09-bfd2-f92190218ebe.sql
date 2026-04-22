
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;

-- Authenticated user can insert booking for themselves
CREATE POLICY "Authenticated users create own booking"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Guests (anonymous) can also book but user_id must be NULL
CREATE POLICY "Guests create booking without account"
  ON public.bookings FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
