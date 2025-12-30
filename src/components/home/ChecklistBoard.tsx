"use client";

import type { ClienteComContatos } from "@/types/crm";
import ClientCard from "./ClientCard";

type Props = {
  todo: ClienteComContatos[];
  doneToday: ClienteComContatos[];
  onMarkDone: (id_cliente: number) => void;
  onUndoDone: (id_cliente: number) => void;
};

export default function ChecklistBoard({
  todo,
  doneToday,
  onMarkDone,
  onUndoDone,
}: Props) {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* ESQUERDA: PARA FAZER */}
      <section className="rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Para fazer</h2>
            <p className="text-xs text-gray-500">{todo.length} clientes</p>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {todo.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              Nada pendente 🎉
            </div>
          ) : (
            todo.map((c) => (
              <ClientCard
                key={c.id_cliente}
                client={c}
                variant="todo"
                onPrimary={() => onMarkDone(c.id_cliente)}
              />
            ))
          )}
        </div>
      </section>

      {/* DIREITA: FEITOS HOJE */}
      <section className="rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Feitos hoje</h2>
            <p className="text-xs text-gray-500">{doneToday.length} clientes</p>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {doneToday.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              Ainda sem contatos marcados hoje.
            </div>
          ) : (
            doneToday.map((c) => (
              <ClientCard
                key={c.id_cliente}
                client={c}
                variant="done"
                onPrimary={() => onUndoDone(c.id_cliente)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
