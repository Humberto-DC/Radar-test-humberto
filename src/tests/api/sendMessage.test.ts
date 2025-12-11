import { describe, it, expect, vi, beforeEach } from "vitest";

// --- MOCK DO SUPABASE (DEVE VIR ANTES DO IMPORT DA ROTA) ---
vi.mock("@/lib/supabaseAdmin", () => {
  // mocks criados dentro do factory
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle }));
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    eq: mockEq,
    insert: mockInsert,
  }));

  return {
    supabaseAdmin: { from: mockFrom },
    __testMocks: { mockSingle, mockInsert, mockEq, mockSelect, mockFrom },
  };
});

// depois de mockar, aí sim importamos a rota
import { POST } from "@/app/api/send_message/route";
import { __testMocks } from "@/lib/supabaseAdmin";

const { mockSingle, mockInsert, mockEq, mockSelect, mockFrom } = __testMocks;

// helper para criar Request
const makeRequest = (body: any) =>
  new Request("http://localhost/api/send_message", {
    method: "POST",
    body: JSON.stringify(body),
  });  

describe("POST /api/send_message", () => {
  beforeEach(() => {
    // limpa todos os mocks
    Object.values(__testMocks).forEach((fn: any) => fn.mockReset());
  });

  it("400 quando 'to' está vazio", async () => {
    const req = makeRequest({
      clientId: 1,
      messageId: 1,
      variables: [],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("404 quando cliente não existe", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Client not found" },
    });

    const req = makeRequest({
      to: "5511999999999",
      clientId: 999,
      messageId: 1,
      variables: [],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Client not found.");
  });
});
