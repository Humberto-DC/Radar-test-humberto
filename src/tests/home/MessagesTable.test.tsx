import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessagesCardsList from "@/components/home/MessagesTable";
import type { Message } from "@/components/home/types";
import { describe, it, expect, vi } from "vitest";

const msgs: Message[] = [
  {
    id_mensagem: "1",
    titulo: "Promo A",
    texto: "desconto",
    categoria: "PROMOÇÃO",
    status: "approved",
  },
  {
    id_mensagem: "2",
    titulo: "Aviso",
    texto: "fechado",
    categoria: "AVISO",
    status: "pending",
  },
];

describe("MessagesCardsList", () => {
  it("filtra por texto e seleciona linha", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <MessagesCardsList
        messages={msgs}
        searchQuery="desconto" // bate no texto da primeira
        selectedMessageID=""
        onSelectMessage={onSelect}
      />
    );

    // ✔ só aparece mensagem approved E que bate no filtro
    expect(screen.getByText("Promo A")).toBeInTheDocument();
    expect(screen.queryByText("Aviso")).not.toBeInTheDocument();

    // ✔ não mostra estado de vazio
    expect(
      screen.queryByText("Nenhuma mensagem encontrada.")
    ).not.toBeInTheDocument();

    // ✔ clique seleciona e dispara callback
    await user.click(screen.getByText("Promo A"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("exibe mensagem de vazio quando nada bate no filtro", () => {
    render(
      <MessagesCardsList
        messages={msgs}
        searchQuery="xxxxx" // nada bate
        selectedMessageID=""
      />
    );

    expect(screen.getByText("Nenhuma mensagem encontrada.")).toBeInTheDocument();
  });
});
