"use client";
import { ArrowLeft, HelpCircle, Home, Search } from "lucide-react";
import Link from "next/link";
import React from "react";

const NotFoundPage = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      <div className="absolute bottom-1/3 left-20 w-14 h-14 bg-yellow-200 rounded-full opacity-20 animate-pulse delay-700"></div>

      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full mb-8 shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Número 404 grande e estilizado */}
        <div className="mb-6 relative">
          <h1 className="text-8xl font-black text-transparent bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text leading-none">
            404
          </h1>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-bounce">
            <span className="block w-full h-full text-white text-xs leading-6 text-center font-bold">
              !
            </span>
          </div>
        </div>

        {/* Mensagem principal */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ops! Página não encontrada
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Parece que essa página saiu do seu orçamento e não conseguimos
            encontrá-la. Que tal voltarmos ao controle das suas finanças?
          </p>
        </div>

        {/* Ilustração simples */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center">
              <div className="text-6xl">🔍</div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-lg">💸</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="space-y-4">
          {/* Botão principal - Voltar ao início */}
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
