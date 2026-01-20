"use client";

type PhoneOption = {
  id: string;
  nome: string;
  funcao: string | null;
  phone: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  clientName: string;
  options: PhoneOption[];
  onPick: (opt: PhoneOption) => void;
};

export default function PhonePickerModal({
  open,
  onClose,
  clientName,
  options,
  onPick,
}: Props) {
  if (!open) return null;

  const valid = options.filter((o) => !!o.phone?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Escolher contato</p>
          <p className="text-xs text-gray-500 truncate">{clientName}</p>
        </div>

        <div className="p-1">
          {valid.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Nenhum telefone cadastrado.</div>
          ) : (
            <div className="space-y-2 p-2">
              {valid.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onPick(o)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-left hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {o.nome}
                      </p>



                      <p className="mt-1 text-xs text-gray-500 truncate">{o.phone}</p>
                    </div>

                    {o.funcao ? (
                      <p className="truncate text-xs text-gray-600">{o.funcao}</p>
                      ) : (
                      <p className="truncate text-xs text-gray-400">Sem função</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
