import { render, screen } from "@testing-library/react";
import MessagesClient from "@/components/messages/MessagesClient";
import type { Message } from "@/components/messages/types";
import { describe, it, expect } from "vitest";

const messages: Message[] = [
  { id_mensagem: "1", titulo: "T1", texto: "x", imagem: null, categoria: "AVISO", status: "pending" },
  { id_mensagem: "2", titulo: "T2", texto: "y", imagem: null, categoria: "PROMOÇÃO", status: "rejected" },
];

describe("MessagesClient", () => {
  it("renderiza as duas tabelas com os status corretos", () => {
    render(<MessagesClient messages={messages} />);

    // Títulos das listas
    expect(screen.getByText("Mensagens Pendentes")).toBeInTheDocument();
    expect(screen.getByText("Mensagens Recusadas")).toBeInTheDocument();

    // Mensagens pendentes
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.queryByText("T2")).toBeInTheDocument(); // recusada aparece na segunda tabela
  });
});
