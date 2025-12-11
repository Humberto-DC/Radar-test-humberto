import { vi } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockNot = vi.fn();

export const supabaseMock = {
  from: vi.fn((table) => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    eq: mockEq,
    not: mockNot,
  })),
};

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: supabaseMock,
}));

export const resetSupabaseMock = () => {
  mockInsert.mockReset();
  mockSelect.mockReset();
  mockUpdate.mockReset();
  mockEq.mockReset();
  mockNot.mockReset();
};
 