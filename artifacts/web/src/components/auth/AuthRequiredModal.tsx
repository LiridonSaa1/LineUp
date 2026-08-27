import React from "react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, LogIn, UserPlus, Sparkles, Lock, X } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = "Llogaria kërkohet",
  description = "Ju lutem kyçuni ose regjistrohuni për të ruajtur berberët tuaj të preferuar.",
}: AuthRequiredModalProps) {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    onClose();
    setLocation("/login");
  };

  const handleRegister = () => {
    onClose();
    setLocation("/register");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[32px] border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl z-50">
        {/* Top Header Background Glow Accent */}
        <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex items-center justify-center overflow-hidden border-b border-border/50">
          {/* Animated decorative blur circles */}
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Floating Icon Pill */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl shadow-black/20 group">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center border-2 border-slate-950 shadow-md">
                <Lock className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aksesi te të Ruajturat</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <Button
              onClick={handleLogin}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Kyçu në Llogari
            </Button>

            <Button
              onClick={handleRegister}
              variant="outline"
              className="w-full h-12 rounded-2xl border-border bg-background/50 hover:bg-accent text-foreground font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              Krijo Llogari të re
            </Button>

            <button
              onClick={onClose}
              className="pt-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Më vonë
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
