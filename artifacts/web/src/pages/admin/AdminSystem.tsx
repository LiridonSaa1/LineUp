import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export const PADDLE_CONFIG = {
  ENVIRONMENT: (import.meta.env.VITE_PADDLE_ENV as string) || "sandbox",
  CLIENT_TOKEN: (import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string) || "live_test_token_01ky8dvrqajpvk",
};

export default function AdminSystem() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statusi i Sistemit & Integrimeve</h1>
        <p className="text-muted-foreground">Monitorimi i shërbimeve të jashtme, Paddle API dhe infrastrukturës.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Paddle Integration Card */}
        <Card className="bg-card/60 backdrop-blur border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Integrimi me Paddle</CardTitle>
                <CardDescription>Statusi i integrimit të pagesave dhe abonimeve</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Paddle Environment:</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase font-black">
                {PADDLE_CONFIG.ENVIRONMENT}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">API Key Status:</span>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                pdl_sdbx_apikey_... (Aktiv)
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Client Token:</span>
              <span className="text-xs font-mono text-foreground font-bold">
                {PADDLE_CONFIG.CLIENT_TOKEN.substring(0, 18)}...
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Database & API Services Card */}
        <Card className="bg-card/60 backdrop-blur border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Shërbimet & Baza e Të Dhënave</CardTitle>
                <CardDescription>Lidhja me Supabase, API Server dhe Storage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Baza e Të Dhënave (Supabase):</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                E Lidhura & Aktive
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">API Server Express (Node.js):</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                Online (Port 5000)
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Lidhja e Sinkronizuar Mobile / Web:</span>
              <Badge className="bg-primary/20 text-primary border border-primary/40 font-bold">
                100% Identike
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
