"use client";

import { useEffect, useRef, useState } from "react";
import { Listbox } from "@headlessui/react";
type Props = {
  onSubmit: (form: FormData) => Promise<boolean>;
  submitting?: boolean;
};

const MAX_IMAGE_MB = 5;

export default function MessageForm({ onSubmit, submitting }: Props) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const imgPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (imgPreviewUrl.current) URL.revokeObjectURL(imgPreviewUrl.current);
    };
  }, []);

  const onPickImage = (f: File | null) => {
    setImage(f);
    if (imgPreviewUrl.current) URL.revokeObjectURL(imgPreviewUrl.current);
    imgPreviewUrl.current = f ? URL.createObjectURL(f) : null;
  };

  const validate = () => {
    const errs: string[] = [];
    if (!category) errs.push("Selecione a categoria.");
    if (!title.trim()) errs.push("Informe o título.");
    if (!body.trim()) errs.push("Informe o texto.");
    if (image) {
      if (!image.type.startsWith("image/")) errs.push("Arquivo de imagem inválido.");
      const mb = image.size / (1024 * 1024);
      if (mb > MAX_IMAGE_MB) errs.push(`Imagem acima de ${MAX_IMAGE_MB} MB.`);
    }
    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (errs.length > 0) {
      const fieldMap: Record<string, string> = {
        "Selecione a categoria.": "#category",
        "Informe o título.": "#title",
        "Informe o texto.": "#body",
      };
      const selector = fieldMap[errs[0]];
      if (selector) document.querySelector<HTMLElement>(selector)?.focus();
      return;
    }

    const form = new FormData();
    form.append("titulo", title);
    form.append("categoria", category);
    form.append("texto", body);
    if (image) form.append("imagem", image);

    const ok = await onSubmit(form);
    if (ok) {
      setCategory("");
      setTitle("");
      setBody("");
      onPickImage(null);
      setErrors([]);
    }
  };

  const categoryOptions = [
    { value: "PROMOÇÃO", label: "Promoção" },
    { value: "AVISO", label: "Aviso" },
    { value: "NOVIDADE", label: "Novidade" },
  ];
  const hasError = (msg: string) => errors.includes(msg);
  const selected = categoryOptions.find((o) => o.value === category)!;

  return (
    <article className="h-full rounded-2xl bg-white shadow-md flex flex-col">
      {/* Cabeçalho do card */}
      <header className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Adicionar nova mensagem
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Preencha os campos abaixo para criar uma nova mensagem.
        </p>
      </header>

      {/* Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-6 py-5"
      >
        {/* Primeira linha: categoria + imagem (lado a lado em telas maiores) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category"
              className="text-sm font-medium text-gray-700"
            >
              Categoria
            </label>

            <Listbox value={category} onChange={setCategory}>
              <div className="relative">
                <Listbox.Button
                  id="category"
                  className={`
                    w-full rounded-md p-2 text-left text-gray-600 focus:ring-2 focus:ring-[#b6f01f]
                    border
                    ${
                      hasError("Selecione a categoria.")
                        ? "border-red-500"
                        : category
                        ? "border-[#b6f01f]"
                        : "border-gray-300"
                    }
                  `}
                >
                  {categoryOptions.find((o) => o.value === category)?.label ||
                    "Selecione uma categoria"}
                </Listbox.Button>

                <Listbox.Options className="absolute w-full mt-1 bg-white border rounded-md shadow-md z-10">
                  {categoryOptions.map((opt) => (
                    <Listbox.Option
                      key={opt.value}
                      value={opt.value}   // <-- APENAS STRING!
                      className={({ active }) =>
                        `cursor-pointer p-2 text-sm ${
                          active
                            ? "bg-[#b6f01f] text-slate-900"
                            : "text-slate-700"
                        }`
                      }
                    >
                      {opt.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>

            {hasError("Selecione a categoria.") && (
              <p id="err-category" className="text-xs text-red-600">
                Selecione a categoria.
              </p>
            )}
          </div>

          {/* Imagem (opcional) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="image"
              className="text-sm font-medium text-gray-700"
            >
              Imagem (opcional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-md border border-gray-300 p-2.5 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b6f01f]"
            />
          </div>
        </div>

        {/* Preview da imagem */}
        {imgPreviewUrl.current && (
          <div className="mt-1">
            <p className="mb-1 text-xs text-gray-500">Pré-visualização:</p>
            <img
              src={imgPreviewUrl.current}
              alt="Preview"
              className="max-h-40 w-auto rounded-md border border-gray-200"
            />
          </div>
        )}

        {/* Título */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="title"
            className="text-sm font-medium text-gray-700"
          >
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={hasError("Informe o título.") || undefined}
            aria-describedby="err-title"
            placeholder="Insira o título da mensagem"
            className={`w-full rounded-md border p-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b6f01f] ${
              hasError("Informe o título.")
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {hasError("Informe o título.") && (
            <p id="err-title" className="text-xs text-red-600">
              Informe o título.
            </p>
          )}
        </div>

        {/* Corpo */}
        <div className="flex flex-col gap-1">
          <label htmlFor="body" className="text-sm font-medium text-gray-600">
            Corpo da mensagem
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={hasError("Informe o texto.") || undefined}
            aria-describedby="err-body"
            placeholder="Insira o corpo da mensagem"
            rows={7}
            className={`w-full rounded-md border p-2.5 text-sm text-gray-500  resize-none focus:outline-none focus:ring-2 focus:ring-[#b6f01f] ${
              hasError("Informe o texto.")
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {hasError("Informe o texto.") && (
            <p id="err-body" className="text-xs text-red-600">
              Informe o texto.
            </p>
          )}
        </div>

        {/* Botão */}
        <div className="mt-3 flex items-center justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="
            rounded-md
            bg-[#b6f01f]
            text-[#1a1a1a]  
            px-6 py-3 text-sm font-semibold
            disabled:opacity-50
            transition-all duration-150
            hover:scale-105
            active:scale-95
            disabled:hover:scale-100
            disabled:active:scale-100"
          >
            {submitting ? "Enviando..." : "Enviar para aprovação"}
          </button>
        </div>
      </form>
    </article>
  );
}
