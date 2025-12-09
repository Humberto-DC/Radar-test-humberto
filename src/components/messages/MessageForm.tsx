"use client";

import { useEffect, useRef, useState } from "react";
import { Listbox } from "@headlessui/react";
import Confirm from "@/components/Confirm";

type Props = {
  onSubmit: (form: FormData) => Promise<boolean>;
  submitting?: boolean;
};

const MAX_IMAGE_MB = 5;

export default function TemplateForm({ onSubmit, submitting }: Props) {
  const [category, setCategory] = useState("");
  const [templateName, setTemplateName] = useState("");   // <- novo
  const [languageCode, setLanguageCode] = useState("pt_BR"); // <- novo
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const imgPreviewUrl = useRef<string | null>(null);
  const [isSendingOpen, setIsSendingOpen] = useState(false);

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

  const categoryOptions = [
    { value: "PROMOCAO", label: "Promoção" },
    { value: "AVISO", label: "Aviso" },
    { value: "NOVIDADE", label: "Novidade" },
  ];

  const languageOptions = [
    { value: "pt_BR", label: "Português (Brasil)" },
    { value: "en_US", label: "Inglês (EUA)" },
  ];

  const validate = () => {
    const errs: string[] = [];

    if (!templateName.trim()) errs.push("Informe o nome interno do template.");
    if (!category) errs.push("Selecione a categoria.");
    if (!title.trim()) errs.push("Informe o título.");
    if (!body.trim()) errs.push("Informe o texto.");

    if (image) {
      if (!image.type.startsWith("image/"))
        errs.push("Arquivo de imagem inválido.");
      const mb = image.size / (1024 * 1024);
      if (mb > MAX_IMAGE_MB) errs.push(`Imagem acima de ${MAX_IMAGE_MB} MB.`);
    }

    setErrors(errs);
    return errs;
  };

  const hasError = (msg: string) => errors.includes(msg);

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length > 0) {
      const fieldMap: Record<string, string> = {
        "Informe o nome interno do template.": "#templateName",
        "Selecione a categoria.": "#category",
        "Informe o título.": "#title",
        "Informe o texto.": "#body",
      };
      const selector = fieldMap[errs[0]];
      if (selector) document.querySelector<HTMLElement>(selector)?.focus();
      return;
    }

    const form = new FormData();
    form.append("template_name", templateName.trim());
    form.append("language_code", languageCode);
    form.append("titulo", title.trim());
    form.append("categoria", category);
    form.append("texto", body.trim());
    if (image) form.append("imagem", image);

    const ok = await onSubmit(form);
    if (ok) {
      setTemplateName("");
      setLanguageCode("pt_BR");
      setCategory("");
      setTitle("");
      setBody("");
      onPickImage(null);
      setErrors([]);
    }
  };

  return (
    <article className="h-full rounded-2xl bg-white shadow-md flex flex-col">
      {/* Cabeçalho do card */}
      <header className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Cadastrar template de mensagem
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Esse formulário é para criar <strong>templates</strong> que serão
          enviados via WhatsApp.
        </p>
      </header>

      {/* Form */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setIsSendingOpen(true);
        }}
        className="flex flex-col gap-4 px-6 py-5"
      >
        {/* Nome do template + Idioma */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="templateName"
              className="text-sm font-medium text-gray-700"
            >
              Nome interno do template
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="ex: promo_black_friday"
              className={`w-full rounded-md border p-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b6f01f] ${
                hasError("Informe o nome interno do template.")
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="text-[11px] text-gray-400">
              Esse é o nome usado no painel do WhatsApp/360dialog. Evite
              espaços, use letras minúsculas e _.
            </p>
            {hasError("Informe o nome interno do template.") && (
              <p className="text-xs text-red-600">
                Informe o nome interno do template.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="language"
              className="text-sm font-medium text-gray-700"
            >
              Idioma do template
            </label>

            <Listbox value={languageCode} onChange={setLanguageCode}>
              <div className="relative">
                <Listbox.Button
                  id="language"
                  className="
                    w-full rounded-md p-2 text-left text-gray-600 focus:ring-2 focus:ring-[#b6f01f]
                    border border-gray-300
                  "
                >
                  {languageOptions.find((o) => o.value === languageCode)?.label}
                </Listbox.Button>

                <Listbox.Options className="absolute w-full mt-1 bg-white border rounded-md shadow-md z-10">
                  {languageOptions.map((opt) => (
                    <Listbox.Option
                      key={opt.value}
                      value={opt.value}
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
          </div>
        </div>

        {/* Categoria + Imagem */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category"
              className="text-sm font-medium text-gray-700"
            >
              Categoria do template
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
                      value={opt.value}
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
            <p className="text-[11px] text-gray-400">
              Use se seu template tiver imagem de cabeçalho (header) ou algo
              similar.
            </p>
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
            Título do template
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={hasError("Informe o título.") || undefined}
            aria-describedby="err-title"
            placeholder="Insira um título amigável para o template"
            className={`w-full rounded-md border p-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b6f01f] ${
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
          <label htmlFor="body" className="text-sm font-medium text-gray-700">
            Corpo do template
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={hasError("Informe o texto.") || undefined}
            aria-describedby="err-body"
            placeholder="Texto do template. Use variáveis como {{1}}, {{2}} se precisar."
            rows={7}
            className={`w-full rounded-md border p-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#b6f01f] ${
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
          <p className="text-[11px] text-gray-400">
            Exemplo: {"\"Olá {{1}}, sua compra no valor de {{2}} foi confirmada.\""}
          </p>
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
            {submitting ? "Salvando..." : "Salvar template para aprovação"}
          </button>
        </div>
      </form>

      {isSendingOpen && (
        <Confirm
          message="Confirmar cadastro do template?"
          onConfirm={() => {
            setIsSendingOpen(false);
            handleSubmit();
          }}
          onCancel={() => setIsSendingOpen(false)}
        />
      )}
    </article>
  );
}
