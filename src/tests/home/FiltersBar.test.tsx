import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import FiltersBar from "@/components/home/FiltersBar";
import { describe, it, expect } from "vitest";

function TestHarness() {
  const [minCredit, setMinCredit] = React.useState("0");
  const [minDaysSince, setMinDaysSince] = React.useState("0");
  const [lastInteraction, setLastInteraction] = React.useState("0");
  const [seller, setSeller] = React.useState("");

  return (
    <FiltersBar
      minCredit={minCredit}
      setMinCredit={setMinCredit}
      minDaysSince={minDaysSince}
      setMinDaysSince={setMinDaysSince}
      lastInteraction={lastInteraction}
      setLastInteraction={setLastInteraction}
      seller={seller}
      setSeller={setSeller}
    />
  );
}

describe("FiltersBar", () => {
  it("atualiza todos os filtros corretamente", async () => {
    render(<TestHarness />);
    const user = userEvent.setup();

    const credit = screen.getByLabelText("Crédito Mínimo") as HTMLInputElement;
    await user.clear(credit);
    await user.type(credit, "123");
    expect(credit.value).toBe("123");

    const days = screen.getByLabelText("Última compra") as HTMLInputElement;
    await user.clear(days);
    await user.type(days, "45");
    expect(days.value).toBe("45");

    const last = screen.getByLabelText("Última interação") as HTMLInputElement;
    await user.clear(last);
    await user.type(last, "9");
    expect(last.value).toBe("9");

    const seller = screen.getByLabelText("Vendedor") as HTMLInputElement;
    await user.clear(seller);
    await user.type(seller, "Maria");
    expect(seller.value).toBe("Maria");
  });
});
