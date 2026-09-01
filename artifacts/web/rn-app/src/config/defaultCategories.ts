export interface Category {
  id: string;
  name: string;
  icon: string;
  target_audience: 'men' | 'women' | 'both';
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Flokët', icon: 'Scissors', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000002', name: 'Mjekra & Rruajtja', icon: 'User', target_audience: 'men' },
  { id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosja', icon: 'Palette', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa', icon: 'Sparkles', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000005', name: 'Vetulla & Qerpikë', icon: 'Eye', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000006', name: 'Thonjtë', icon: 'Hand', target_audience: 'women' },
  { id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup', icon: 'Smile', target_audience: 'women' },
  { id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim & Trup', icon: 'Zap', target_audience: 'both' }
];

export const CATEGORY_ORDER = DEFAULT_CATEGORIES.map(c => c.name);

export const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  // 1. Flokët
  { id: 'e1000000-0000-0000-0000-000000000001', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Prerje flokësh' },
  { id: 'e1000000-0000-0000-0000-000000000002', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Larje flokësh' },
  { id: 'e1000000-0000-0000-0000-000000000003', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Stilim flokësh' },
  { id: 'e1000000-0000-0000-0000-000000000004', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Frizurë' },
  { id: 'e1000000-0000-0000-0000-000000000005', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Trajtim flokësh' },

  // 2. Mjekra & Rruajtja
  { id: 'e1000000-0000-0000-0000-000000000006', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rregullim mjekre' },
  { id: 'e1000000-0000-0000-0000-000000000007', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rruajtje' },
  { id: 'e1000000-0000-0000-0000-000000000008', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rruajtje koke' },
  { id: 'e1000000-0000-0000-0000-000000000009', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Ngjyrosje mjekre' },

  // 3. Ngjyrosja
  { id: 'e1000000-0000-0000-0000-000000000010', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosje flokësh' },
  { id: 'e1000000-0000-0000-0000-000000000011', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosje rrënjësh' },
  { id: 'e1000000-0000-0000-0000-000000000012', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Fije & Balayage' },
  { id: 'e1000000-0000-0000-0000-000000000013', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Zbardhim' },
  { id: 'e1000000-0000-0000-0000-000000000014', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Toner' },

  // 4. Paketa
  { id: 'e1000000-0000-0000-0000-000000000015', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Nuse' },
  { id: 'e1000000-0000-0000-0000-000000000016', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Dhëndër' },
  { id: 'e1000000-0000-0000-0000-000000000017', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Event' },
  { id: 'e1000000-0000-0000-0000-000000000018', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Dasmë' },
  { id: 'e1000000-0000-0000-0000-000000000019', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa të personalizuara' },

  // 5. Vetulla & Qerpikë
  { id: 'e1000000-0000-0000-0000-000000000020', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Vetulla' },
  { id: 'e1000000-0000-0000-0000-000000000021', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Ngjyrosje vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000022', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Laminim vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000023', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Qerpikë' },
  { id: 'e1000000-0000-0000-0000-000000000024', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Lash Lift' },

  // 6. Thonjtë
  { id: 'e1000000-0000-0000-0000-000000000025', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Manikyr' },
  { id: 'e1000000-0000-0000-0000-000000000026', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Pedikyr' },
  { id: 'e1000000-0000-0000-0000-000000000027', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Xhel' },
  { id: 'e1000000-0000-0000-0000-000000000028', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Zgjatje thonjsh' },
  { id: 'e1000000-0000-0000-0000-000000000029', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Dizajn thonjsh' },
  { id: 'e1000000-0000-0000-0000-000000000030', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Heqje xheli' },

  // 7. Makeup
  { id: 'e1000000-0000-0000-0000-000000000031', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup' },
  { id: 'e1000000-0000-0000-0000-000000000007', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për Event' },
  { id: 'e1000000-0000-0000-0000-000000000033', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për Nuse' },
  { id: 'e1000000-0000-0000-0000-000000000034', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për Foto' },

  // 8. Depilim & Trup
  { id: 'e1000000-0000-0000-0000-000000000035', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim fytyre' },
  { id: 'e1000000-0000-0000-0000-000000000036', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim trupi' },
  { id: 'e1000000-0000-0000-0000-000000000037', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim këmbësh' },
  { id: 'e1000000-0000-0000-0000-000000000038', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim duarsh' },
  { id: 'e1000000-0000-0000-0000-000000000039', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim me laser' }
];
