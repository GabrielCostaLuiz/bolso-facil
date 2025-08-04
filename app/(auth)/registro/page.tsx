"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signup, signupGoogle } from "../actions";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isLoading, setIsLoading] = useState(false);

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-8 ">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-4">
            <span className="text-2xl">🧁</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Junte-se à Deguste!
          </h1>
          <p className="text-gray-600">
            Crie sua conta e descubra os melhores doces artesanais
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={() => setIsLoading(true)}>
            <input type="hidden" name="redirect" value={redirectTo} />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Seu nome"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* <div className="flex items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Concordo com os{" "}
                <Link
                  href="/termos"
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link
                  href="/privacidade"
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  Política de Privacidade
                </Link>
              </label>
            </div> */}

            {/* <div className="flex items-center gap-3">
              <input
                id="newsletter"
                name="newsletter"
                type="checkbox"
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="newsletter" className="text-sm text-gray-600">
                Quero receber novidades e promoções por e-mail
              </label>
            </div> */}

            <button
              type="submit"
              formAction={signup}
              disabled={isLoading}
              className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:shadow-lg ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:scale-105 cursor-pointer"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Criando...
                </div>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <form>
            <input type="hidden" name="redirect" value={redirectTo} />
            <button
              type="submit"
              formAction={signupGoogle}
              className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
            >
              {/** biome-ignore lint/a11y/noSvgWithoutTitle: logo do google */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Criar conta com Google
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-pink-600 hover:text-pink-700 font-semibold"
            >
              Fazer login
            </Link>
          </p>
        </div>

        {/* <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 text-center">
            Por que criar uma conta?
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>Pedidos mais rápidos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span>Histórico de compras</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💝</span>
              <span>Ofertas exclusivas</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>Programa de pontos</span>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
