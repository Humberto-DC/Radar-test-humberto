"use client";

import { Check, X as XIcon } from "lucide-react";

type Props = {
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  message = "Confirmar ação?",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-3 shadow-xl w-[200px] text-center">
        <p className="text-lg font-medium mb-5">{message}</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={onCancel}
            className="
              p-3 rounded-full border border-red-500 text-red-500
              hover:bg-red-100 transition
            "
          >
            <XIcon size={22} strokeWidth={2.2} />
          </button>

          <button
            onClick={onConfirm}
            className="
              p-3 rounded-full border border-green-600 text-green-600
              hover:bg-green-100 transition
            "
          >
            <Check size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
