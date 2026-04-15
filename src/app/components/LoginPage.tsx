import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import {
  Shield,
  Anchor,
  Waves,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comptes de démonstration
  const demoAccounts = [
    { email: 'admin@dirm-med.gouv.fr', password: 'admin123', role: 'Administrateur', color: 'from-purple-500 to-pink-500' },
    { email: 'chef@dirm-med.gouv.fr', password: 'chef123', role: 'Chef de service', color: 'from-blue-500 to-cyan-500' },
    { email: 'agent@dirm-med.gouv.fr', password: 'agent123', role: 'Agent', color: 'from-green-500 to-emerald-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      setError('Adresse email invalide');
      return;
    }

    setIsLoading(true);

    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1500));

      const success = await onLogin(email, password, rememberMe);

      if (!success) {
        setError('Email ou mot de passe incorrect');
        toast.error('Échec de la connexion');
      } else {
        toast.success('Connexion réussie !');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const success = await onLogin(demoEmail, demoPassword, false);
      
      if (success) {
        toast.success(`Connecté en tant que ${demoEmail}`);
      }
    } catch (err) {
      setError('Erreur lors de la connexion démo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <Waves className="absolute top-10 right-10 h-32 w-32 text-blue-200/30" />
        <Anchor className="absolute bottom-10 left-10 h-24 w-24 text-indigo-200/30" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">DUERP</h1>
                <p className="text-lg text-gray-600">Gestion des Risques Professionnels</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Direction Interrégionale<br />de la Mer Méditerranée
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Plateforme sécurisée de gestion du Document Unique d'Évaluation 
                des Risques Professionnels et de l'accidentologie.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-xs text-gray-600">Sécurisé</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-xs text-gray-600">Disponible</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Conformité réglementaire
            </h3>
            <p className="text-sm text-gray-700">
              Conforme aux articles L4121-1 à L4121-5 et R4121-1 à R4121-4 du Code du travail.
              Signature électronique conforme au règlement eIDAS.
            </p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex flex-col justify-center">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center justify-center lg:hidden">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center lg:text-left">Connexion</CardTitle>
              <CardDescription className="text-center lg:text-left">
                Accédez à votre espace DUERP sécurisé
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@dirm-med.gouv.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-gray-600 cursor-pointer font-normal"
                    >
                      Se souvenir de moi
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => toast.info('Contactez votre administrateur pour réinitialiser votre mot de passe')}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Comptes de démonstration</span>
                </div>
              </div>

              {/* Demo accounts */}
              <div className="space-y-3">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDemoLogin(account.email, account.password)}
                    disabled={isLoading}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow`}>
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{account.role}</p>
                        <p className="text-xs text-gray-600 truncate">{account.email}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  En vous connectant, vous acceptez les conditions d'utilisation et la politique de confidentialité.
                </p>
                <p className="text-xs text-center text-gray-400 mt-2">
                  © 2026 Direction Interrégionale de la Mer Méditerranée
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}