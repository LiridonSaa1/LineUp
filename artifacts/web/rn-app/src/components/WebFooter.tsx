import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

const logoImg = require('../../assets/logo.png');

const extractUri = (mod: any): string => {
  if (!mod) return "";
  if (typeof mod === "string") return mod;
  if (typeof mod === "object") {
    if (typeof mod.default === "string") return mod.default;
    if (mod.default && typeof mod.default === "object" && typeof mod.default.uri === "string") return mod.default.uri;
    if (typeof mod.uri === "string") return mod.uri;
    if (typeof mod.src === "string") return mod.src;
  }
  return String(mod || "");
};

interface WebFooterProps {
  onNavigateTab?: (tabIndex: number) => void;
  onOpenRegisterShop?: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
}

export const WebFooter: React.FC<WebFooterProps> = ({
  onNavigateTab,
  onOpenRegisterShop,
  onOpenLegal
}) => {
  return (
    <footer className="mt-16 w-full border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div>
          <div 
            onClick={() => onNavigateTab ? onNavigateTab(0) : window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img 
              src={extractUri(logoImg)} 
              alt="LineUp" 
              style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
              className="rounded-2xl transition-transform hover:scale-105" 
            />
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-bold text-slate-900">Platforma</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 font-medium">
            <li>
              <button 
                type="button" 
                onClick={() => onNavigateTab ? onNavigateTab(0) : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Ballina
              </button>
            </li>
            <li>
              <button 
                type="button" 
                onClick={() => onNavigateTab ? onNavigateTab(1) : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Kërko
              </button>
            </li>
            <li>
              <button 
                type="button" 
                onClick={() => onNavigateTab ? onNavigateTab(2) : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Aktiviteti
              </button>
            </li>
            <li>
              <button 
                type="button" 
                onClick={() => onNavigateTab ? onNavigateTab(3) : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Profili
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-bold text-slate-900">Për bizneset</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 font-medium">
            <li>
              <button 
                type="button" 
                onClick={() => onOpenRegisterShop ? onOpenRegisterShop() : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Planet e çmimeve
              </button>
            </li>
            <li>
              <button 
                type="button" 
                onClick={() => onOpenRegisterShop ? onOpenRegisterShop() : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Bëhu partner
              </button>
            </li>
            <li>
              <button 
                type="button" 
                onClick={() => onOpenRegisterShop ? onOpenRegisterShop() : null} 
                className="hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                Ndihmë
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-bold text-slate-900">Kontakt</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 font-medium">
            <li>
              <a href="mailto:info@lineup.ks" className="hover:text-slate-900 transition-colors">
                info@lineup.ks
              </a>
            </li>
            <li>
              <a href="tel:+38344000000" className="hover:text-slate-900 transition-colors">
                +383 44 000 000
              </a>
            </li>
            <li>
              <span className="text-slate-500">
                Prishtinë, Kosovë
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 font-semibold">
        © {new Date().getFullYear()} LineUp. Të gjitha të drejtat e rezervuara.
      </div>
    </footer>
  );
};
