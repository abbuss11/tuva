"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 bg-grid-slate bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-glow">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">TUVA Admin</h1>
          <p className="mt-1 text-sm text-white/50">
            Connectez-vous pour gérer vos formations
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card space-y-4 p-8 shadow-elevated"
        >
          <Input
            id="email"
            type="email"
            label="Adresse email"
            placeholder="admin@organisation.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            labelClassName="text-white/70"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400 focus:ring-brand-400/20"
          />
          <Input
            id="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            labelClassName="text-white/70"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400 focus:ring-brand-400/20"
          />
          {error && (
            <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Lock className="h-4 w-4" />
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Accès réservé aux administrateurs TUVA
        </p>
      </div>
    </div>
  );
}
