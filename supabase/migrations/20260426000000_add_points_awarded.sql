-- 预订记录加 points_awarded 字段，用于取消时精确扣回积分
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER NOT NULL DEFAULT 0;
