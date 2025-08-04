"use client";
import { useStackApp } from "@stackframe/stack";
import { DollarSign } from "lucide-react";
import { useSearchParams } from "next/navigation";

const LoginPage = () => {
  const app = useStackApp();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Container principal */}
      <div className="w-full max-w-md">
        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full mb-4">
              <DollarSign />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bolso Fácil
            </h1>
            <p className="text-gray-600">
              Gerencie sua vida financeira de forma inteligente
            </p>
          </div>

          {/* Botão de login com Google */}
          <div className="space-y-6">
            <form>
              <input type="hidden" name="redirect" value={redirectTo} />
              <button
                type="submit"
                formAction={async () => await app.signInWithOAuth("google")}
                className="w-full cursor-pointer bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3"
              >
                {/** biome-ignore lint/a11y/noSvgWithoutTitle: aqui é o logo do google */}
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
                Continuar com Google
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Acesso seguro e rápido
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-emerald-600 font-semibold text-sm">
                  Controle Total
                </div>
                <div className="text-emerald-600 text-xs mt-1">
                  Gastos e receitas
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-semibold text-sm">
                  Segurança
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  Dados protegidos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements para efeito visual */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-0 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default LoginPage;
