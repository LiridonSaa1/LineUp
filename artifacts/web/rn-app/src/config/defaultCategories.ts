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
  { id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosja e Flokëve', icon: 'Palette', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa Speciale', icon: 'Sparkles', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000005', name: 'Vetulla & Qerpikë', icon: 'Eye', target_audience: 'both' },
  { id: 'c1000000-0000-0000-0000-000000000006', name: 'Thonjtë', icon: 'Hand', target_audience: 'women' },
  { id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup', icon: 'Smile', target_audience: 'women' },
  { id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim & Kujdes Trupi', icon: 'Zap', target_audience: 'both' }
];

export const CATEGORY_ORDER = DEFAULT_CATEGORIES.map(c => c.name);

export const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  // 1. Flokët
  { id: 'e1000000-0000-0000-0000-000000000001', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Prerje flokësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000002', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Skin Fade (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000003', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Buzz Cut (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000004', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Prerje për fëmijë (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000005', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Prerje me makinë (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000006', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Larje flokësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000007', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Larje dhe stilim (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000008', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Stilim flokësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000009', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Frizurë për event (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000010', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Frizurë për nuse (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000011', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Frizurë për fejesë (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000012', category_id: 'c1000000-0000-0000-0000-000000000001', name: 'Trajtim për flokë (Meshkuj & femra)' },

  // 2. Mjekra & Rruajtja
  { id: 'e1000000-0000-0000-0000-000000000013', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rregullim mjekre (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000014', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Formësim mjekre (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000015', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rruajtje me brisk (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000016', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rruajtje tradicionale me peshqir të nxehtë (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000017', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Rruajtje koke (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000018', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Prerje me makinë (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000019', category_id: 'c1000000-0000-0000-0000-000000000002', name: 'Ngjyrosje mjekre (Meshkuj)' },

  // 3. Ngjyrosja e Flokëve
  { id: 'e1000000-0000-0000-0000-000000000020', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosje flokësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000021', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Ngjyrosje rrënjësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000022', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Mbulim i thinjave (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000023', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Fije (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000024', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Balayage (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000025', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Ombre (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000026', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Zbardhim flokësh (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000027', category_id: 'c1000000-0000-0000-0000-000000000003', name: 'Toner (Meshkuj & femra)' },

  // 4. Paketa Speciale
  { id: 'e1000000-0000-0000-0000-000000000028', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Nuse (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000029', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Dhëndër (Meshkuj)' },
  { id: 'e1000000-0000-0000-0000-000000000030', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Fejesë (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000031', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Event (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000032', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Dasmë (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000033', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa Çift (Meshkuj & femra)' },
  { id: 'e1000000-0000-0000-0000-000000000034', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa për Shoqëruese të Nuses (Femra)' },
  { id: 'e1000000-0000-0000-0000-000000000035', category_id: 'c1000000-0000-0000-0000-000000000004', name: 'Paketa Familjare (Meshkuj & femra)' },

  // 5. Vetulla & Qerpikë
  { id: 'e1000000-0000-0000-0000-000000000036', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Rregullim vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000037', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Rregullim vetullash me pe' },
  { id: 'e1000000-0000-0000-0000-000000000038', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Ngjyrosje vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000039', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Laminim vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000040', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Lash Lift' },
  { id: 'e1000000-0000-0000-0000-000000000041', category_id: 'c1000000-0000-0000-0000-000000000005', name: 'Ngjyrosje qerpikësh' },

  // 6. Thonjtë
  { id: 'e1000000-0000-0000-0000-000000000042', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Manikyr klasik' },
  { id: 'e1000000-0000-0000-0000-000000000043', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Manikyr me xhel' },
  { id: 'e1000000-0000-0000-0000-000000000044', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Zgjatje thonjsh' },
  { id: 'e1000000-0000-0000-0000-000000000045', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Përforcim thonjsh' },
  { id: 'e1000000-0000-0000-0000-000000000046', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Heqje xheli' },
  { id: 'e1000000-0000-0000-0000-000000000047', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Dizajn thonjsh' },
  { id: 'e1000000-0000-0000-0000-000000000048', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Pedikyr klasik' },
  { id: 'e1000000-0000-0000-0000-000000000049', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Pedikyr me xhel' },
  { id: 'e1000000-0000-0000-0000-000000000050', category_id: 'c1000000-0000-0000-0000-000000000006', name: 'Kujdes për thonjtë' },

  // 7. Makeup
  { id: 'e1000000-0000-0000-0000-000000000051', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup ditor' },
  { id: 'e1000000-0000-0000-0000-000000000052', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup mbrëmjeje' },
  { id: 'e1000000-0000-0000-0000-000000000053', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për event' },
  { id: 'e1000000-0000-0000-0000-000000000054', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për fejesë' },
  { id: 'e1000000-0000-0000-0000-000000000055', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për nuse' },
  { id: 'e1000000-0000-0000-0000-000000000056', category_id: 'c1000000-0000-0000-0000-000000000007', name: 'Makeup për fotografi' },

  // 8. Depilim & Kujdes Trupi
  { id: 'e1000000-0000-0000-0000-000000000057', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim me dyllë – fytyrë' },
  { id: 'e1000000-0000-0000-0000-000000000058', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim me dyllë – trup' },
  { id: 'e1000000-0000-0000-0000-000000000059', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim me laser' },
  { id: 'e1000000-0000-0000-0000-000000000060', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim vetullash' },
  { id: 'e1000000-0000-0000-0000-000000000061', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim buze' },
  { id: 'e1000000-0000-0000-0000-000000000062', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim këmbësh' },
  { id: 'e1000000-0000-0000-0000-000000000063', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim duarsh' },
  { id: 'e1000000-0000-0000-0000-000000000064', category_id: 'c1000000-0000-0000-0000-000000000008', name: 'Depilim shpine' }
];
