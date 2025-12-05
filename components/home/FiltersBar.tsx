"use client";
import React from "react";

type Props = {
  minCredit: string;
  setMinCredit: (v: string) => void;
  minDaysSince: string;
  setMinDaysSince: (v: string) => void;
  lastInteraction: string;
  setLastInteraction: (v: string) => void;
  seller: string;
  setSeller: (v: string) => void;
};

export default function FiltersBar({
  minCredit, setMinCredit,
  minDaysSince, setMinDaysSince,
  lastInteraction, setLastInteraction,
  seller, setSeller,
}: Props) {
  const inputStyle =
    "w-full border border-gray-400 px-3 py-2 rounded text-gray-700 " +
    "focus:outline-none focus:ring-2 focus:ring-[#b6f01f] focus:border-[#b6f01f]";

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">

      <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow">
        <label htmlFor="minCredit" className="text-sm text-gray-600 block mb-2">
          Crédito Mínimo
        </label>
        <input
          id="minCredit"
          type="number"
          min={0}
          value={minCredit}
          onChange={(e) => setMinCredit(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow">
        <label htmlFor="minDays" className="text-sm text-gray-600 block mb-2">
          Última compra
        </label>
        <input
          id="minDays"
          type="number"
          min={0}
          value={minDaysSince}
          onChange={(e) => setMinDaysSince(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow">
        <label
          htmlFor="lastInteraction"
          className="text-sm text-gray-600 block mb-2"
        >
          Última interação
        </label>
        <input
          id="lastInteraction"
          type="number"
          min={0}
          value={lastInteraction}
          onChange={(e) => setLastInteraction(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow">
        <label htmlFor="seller" className="text-sm text-gray-600 block mb-2">
          Vendedor
        </label>
        <input
          id="seller"
          type="search"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          className={inputStyle}
        />
      </div>

    </div>
  );
}
