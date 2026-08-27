import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertCircle, LogIn, Mail, Lock, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const { login, signUp, authStatus } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error?.message === 'UNAUTHORIZED') {
        setErrorMsg('Seu e-mail não está na lista de autorizados. Entre em contato com o administrador.');
      } else {
        setErrorMsg(error?.message || 'Erro ao autenticar. Verifique seus dados.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-dark-950" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v2.02c-2.84.48-5 2.94-5 5.91s2.16 5.43 5 5.91v2.02zm2-15.86v2.02c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.94-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Muay Thai Manager</h1>
          <p className="text-dark-400">Sistema de gestão para professores</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {isSignUp ? 'Criar conta' : 'Bem-vindo'}
            </h2>
            <p className="text-sm text-dark-400">
              {isSignUp ? 'Cadastre-se para acessar o sistema' : 'Faça login para acessar sua conta'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Erro de acesso</p>
                <p className="text-xs text-red-400/70 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Criar conta
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>

          <p className="text-xs text-dark-500 text-center mt-6">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-dark-600 mt-8">
          Versão 1.0.0 - Feito para professores de Muay Thai
        </p>
      </div>
    </div>
  );
}
