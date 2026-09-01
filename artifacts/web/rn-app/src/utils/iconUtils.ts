import React from 'react';
import { Scissors, User, Palette, Sparkles, Eye, Hand, Smile, Zap, Waves, Store } from 'lucide-react-native';

const ICON_MAP: Record<string, any> = {
  Scissors,
  User,
  Palette,
  Sparkles,
  Eye,
  Hand,
  Smile,
  Zap,
  Waves,
  Store,
};

const CATEGORY_NAME_MAP: Record<string, any> = {
  'Flokët': Scissors,
  'Flokët & Prerje': Scissors,
  'Flokët & Trajtimet': Scissors,
  'Mjekra & Rruajtja': User,
  'Ngjyrosja e Flokëve': Palette,
  'Paketa Speciale': Sparkles,
  'Vetulla & Qerpikë': Eye,
  'Thonjtë': Hand,
  'Makeup': Smile,
  'Depilim & Kujdes Trupi': Zap,
  'Depilim & Trup': Zap,
  'Masazh & Spa': Sparkles,
};

export const getCategoryIcon = (cat: any): any => {
  if (!cat) return Scissors;

  if (typeof cat === 'function' || (typeof cat === 'object' && cat !== null && '$$typeof' in cat)) {
    return cat;
  }

  const iconProp = typeof cat === 'string' ? cat : cat?.icon;
  const nameProp = typeof cat === 'string' ? cat : (cat?.name || cat?.title);

  // 1. Direct match by icon string name (e.g. "User", "Eye", "Hand", "Zap")
  if (typeof iconProp === 'string' && ICON_MAP[iconProp.trim()]) {
    return ICON_MAP[iconProp.trim()];
  }

  // 2. Direct match by category name
  if (typeof nameProp === 'string' && nameProp.trim()) {
    const cleanName = nameProp.trim();
    if (CATEGORY_NAME_MAP[cleanName]) {
      return CATEGORY_NAME_MAP[cleanName];
    }
    const matchedKey = Object.keys(CATEGORY_NAME_MAP).find(
      k => k.toLowerCase() === cleanName.toLowerCase() || cleanName.toLowerCase().includes(k.toLowerCase())
    );
    if (matchedKey) return CATEGORY_NAME_MAP[matchedKey];
  }

  return Scissors;
};
