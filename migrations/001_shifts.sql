-- Phase 1: Shifts table for cash register open/close
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branchId UUID NOT NULL DEFAULT 'c0000001-0000-0000-0000-000000000001',
  cashierId UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  openingBalance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closingBalance NUMERIC(12,2),
  cashCount NUMERIC(12,2),
  totalSales NUMERIC(12,2) NOT NULL DEFAULT 0,
  totalCash NUMERIC(12,2) NOT NULL DEFAULT 0,
  totalCard NUMERIC(12,2) NOT NULL DEFAULT 0,
  totalOther NUMERIC(12,2) NOT NULL DEFAULT 0,
  totalOrders INTEGER NOT NULL DEFAULT 0,
  openedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closedAt TIMESTAMPTZ,
  notes TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON shifts FOR ALL USING (true);

GRANT ALL ON shifts TO authenticated;
GRANT ALL ON shifts TO anon;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_cashierId ON shifts(cashierId);
CREATE INDEX IF NOT EXISTS idx_shifts_branchId ON shifts(branchId);
CREATE INDEX IF NOT EXISTS idx_shifts_openedAt ON shifts(openedAt);
