"use client";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

const BestPracticesModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Ícone de Ajuda no canto inferior direito */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-10 right-12 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
        aria-label="Boas práticas"
      >
        <AlertCircle size={30} />
      </button>

      {/* Modal com as boas práticas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-150 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Boas Práticas</h2>
            <ul className="space-y-4 text-sm text-slate-700">
              <li>
                <strong>1. Consentimento:</strong> Antes de enviar promoções ou mensagens em geral, certifique-se de enviar a mensagem de consentimento para todos os seus clientes.
              </li>
              <li>
                <strong>2. Clientes que não consentirem:</strong> Caso algum cliente não consinta, acesse a página "Clientes" e marque-o como inativo. Você poderá reverter essa alteração posteriormente, se necessário.
              </li>
              <li>
                <strong>3. Evitar envios duplicados:</strong> Em caso de dúvida, verifique a página de "Envios" para garantir que você não está enviando mensagens duplicadas, evitando assim insatisfação dos clientes.
              </li>
              <li>
                <strong>4. Envio de Feedback:</strong> Se você encontrar algum erro ou tiver sugestões para melhorar a aplicação, não deixe de enviar um feedback! Na parte inferior da barra lateral temos uma seção exclusiva para isso.
              </li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BestPracticesModal;
