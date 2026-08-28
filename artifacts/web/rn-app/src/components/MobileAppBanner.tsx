import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { X, Smartphone, Download, Sparkles } from "lucide-react-native";

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

export const MobileAppBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobileDevice) {
        setVisible(true);
      }
    }
  }, []);

  if (!visible) return null;

  const APP_URL = "https://apps.apple.com"; // Default app link

  return (
    <div className="relative z-50 bg-[#161719] text-white px-4 py-2.5 flex items-center justify-between shadow-md border-b border-slate-800">
      <div className="flex items-center gap-3">
        <img src={extractUri(logoImg)} alt="LineUp App" className="h-8 w-8 object-contain rounded-lg bg-white/10 p-0.5" />
        <div>
          <p className="text-xs font-black text-white leading-none flex items-center gap-1">
            Përvojë më e mirë në Aplikacion! <Sparkles size={11} color="#fbbf24" fill="#fbbf24" />
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Shkarko LineUp falas te App Store / Google Play</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => Linking.openURL(APP_URL)}
          className="bg-[#3473ef] hover:bg-blue-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Hap në App
        </button>
        <button
          onClick={() => setVisible(false)}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Mbyll"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
