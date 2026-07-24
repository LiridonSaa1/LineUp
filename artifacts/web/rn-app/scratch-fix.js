const fs = require('fs');
const homePath = 'c:/Users/lirid/OneDrive/Desktop/LineUp/artifacts/web/rn-app/src/screens/HomeScreen.tsx';
const searchPath = 'c:/Users/lirid/OneDrive/Desktop/LineUp/artifacts/web/rn-app/src/screens/SearchScreen.tsx';

const homeContent = fs.readFileSync(homePath, 'utf8');
let searchContent = fs.readFileSync(searchPath, 'utf8');

searchContent = searchContent.replace(
  "import { View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, FlatList, Keyboard } from 'react-native';",
  "import { View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, FlatList, Keyboard, Modal } from 'react-native';"
);

const catIconsStr = `const CATEGORY_ICONS: Record<string, any> = {
  'Flokë & Stilim': Scissors,
  'Mjekër & Estetikë': User,
  'Thonjtë': Hand,
  'Grim & Bukuri': Smile,
  'Kujdesi i Lëkurës': Shield,
  'Spa & Relaks': Waves,
  'Depilim': Zap,
  'Raste të Veçanta': Sparkles
};`;
searchContent = searchContent.replace(/const CATEGORIES = \[[\s\S]*?\];/, catIconsStr);

const statesToAdd = `  // Dynamic Categories
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);`;
searchContent = searchContent.replace("const [activeFilterTab, setActiveFilterTab] = useState('All');", "const [activeFilterTab, setActiveFilterTab] = useState('All');\n\n" + statesToAdd);

const oldUseEffect = `  useEffect(() => {
    fetchRecents();
  }, []);`;
const newUseEffect = `  useEffect(() => {
    fetchRecents();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setDbCategories(catData);
      
      const { data: subData } = await supabase.from('subcategories').select('*');
      if (subData) setDbSubcategories(subData);
    } catch (e) {
      console.warn('Error fetching categories:', e);
    }
  };`;
searchContent = searchContent.replace(oldUseEffect, newUseEffect);

const gridTargetStart = `<View className="flex-row flex-wrap justify-between">`;
const gridTargetEnd = `            </View>`;
const gridRegex = new RegExp(`<View className="flex-row flex-wrap justify-between">[\\s\\S]*?{CATEGORIES\\.map[\\s\\S]*?</View>`);
const gridReplacement = `<View className="flex-row flex-wrap justify-between">
              {dbCategories.map((cat, i) => {
                const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setSelectedMainCategory(cat);
                      setShowSubModal(true);
                    }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl items-center justify-center py-6 mb-4"
                    style={{ width: (width - 60) / 2 }}
                  >
                    <IconComponent size={32} color="#161719" strokeWidth={1.5} />
                    <Text className="text-[13px] font-bold text-[#161719] mt-3 text-center px-2">{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>`;
searchContent = searchContent.replace(gridRegex, gridReplacement);

// Modal logic
const modalStart = homeContent.indexOf('{/* Subcategory Modal */}');
const modalEnd = homeContent.lastIndexOf('</Modal>');
if (modalStart !== -1 && modalEnd !== -1) {
  let modalCode = homeContent.substring(modalStart, modalEnd + 8);
  
  // Custom logic for the modal button in SearchScreen
  const homeSearchLogic = `if (onSearch && queryText) {
                  onSearch(queryText);
                }`;
  const searchScreenLogic = `setSelectedTreatment(queryText);
                handleSearchTrigger(queryText);`;
  modalCode = modalCode.replace(homeSearchLogic, searchScreenLogic);
  
  const allBtnRegex = new RegExp(`<TouchableOpacity[\\s\\S]*?className=\\{\`rounded-2xl py-4 items-center mb-4 border \\$\\{!selectedMainCategory \\|\\| !dbSubcategories\\.filter\\(s => s\\.category_id === selectedMainCategory\\?\\.id\\)\\.every\\(s => selectedSubIds\\.includes\\(s\\.id\\)\\) \\? 'bg-\\[#3473ef\\]\\/10 border-\\[#3473ef\\]' : 'bg-slate-50 border-slate-200'\\}\`\\}[\\s\\S]*?>[\\s\\S]*?</TouchableOpacity>`);
  const allBtnLogic = `<TouchableOpacity
                onPress={() => {
                  if (selectedMainCategory) {
                    const currentCategorySubIds = dbSubcategories
                      .filter(s => s.category_id === selectedMainCategory.id)
                      .map(s => s.id);
                    
                    setSelectedSubIds(prev => {
                      const allSelected = currentCategorySubIds.every(id => prev.includes(id));
                      if (allSelected) {
                        return prev.filter(id => !currentCategorySubIds.includes(id));
                      } else {
                        const newSelection = [...prev];
                        currentCategorySubIds.forEach(id => {
                          if (!newSelection.includes(id)) newSelection.push(id);
                        });
                        return newSelection;
                      }
                    });
                  }
                }}
                className={\`rounded-2xl py-4 items-center mb-4 border \${!selectedMainCategory || dbSubcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}\`}
              >
                <Text className={\`font-black text-base \${!selectedMainCategory || dbSubcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'text-[#3473ef]' : 'text-[#64748b]'}\`}>Të gjitha në këtë kategori</Text>
              </TouchableOpacity>`;
  modalCode = modalCode.replace(allBtnRegex, allBtnLogic);
  
  // Inject at the end before closing tag
  searchContent = searchContent.replace(/<\/Animated\.View>\s*<\/View>/g, `</Animated.View>\n\n${modalCode}\n\n</View>`);
}

fs.writeFileSync(searchPath, searchContent);
console.log('Fixed SearchScreen from HomeScreen completely!');
