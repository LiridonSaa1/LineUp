import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, FlatList, Keyboard, Modal, Pressable } from 'react-native';
import { X, Search, MapPin, Calendar, Grid, Scissors, Hand, Eye, Sparkles, User, Smile, Waves, ArrowLeft, ChevronRight, AlertCircle, Check, ChevronLeft, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { supabase } from '@/config/supabase';

const { width } = Dimensions.get('window');
const USER_ID = 'demo_user_123';

interface SearchScreenProps {
  onClose: () => void;
  onSearch: (filters: {
    query: string;
    city: string;
    lat?: number;
    lng?: number;
    date?: string;
    time?: string;
    subIds?: string[];
    categoryName?: string;
    shouldClose?: boolean;
  }) => void;
  currentLocation?: string;
  categories?: any[];
  subcategories?: any[];
  initialQuery?: string;
  initialDate?: string;
  initialTime?: string;
  initialSubIds?: string[];
  initialCategoryName?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Flokë & Stilim': Scissors,
  'Mjekër & Estetikë': User,
  'Thonjtë': Hand,
  'Grim & Bukuri': Smile,
  'Kujdesi i Lëkurës': Shield,
  'Spa & Relaks': Waves,
  'Depilim': Zap,
  'Raste të Veçanta': Sparkles
};

const TREATMENTS = [
  'Haircut & Styling',
  'Hair Coloring',
  'Hair Treatment',
  'Beard & Grooming',
  'Nails',
  'Makeup',
  'Brows & Lashes',
  'Skin Care',
  'Body Care'
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onClose,
  onSearch,
  currentLocation = "Lokacioni aktual",
  categories = [],
  subcategories = [],
  initialQuery = "",
  initialDate = "Anytime",
  initialTime = "Anytime",
  initialSubIds = [],
  initialCategoryName = ""
}) => {
  const [activePanel, setActivePanel] = useState<'main' | 'treatment' | 'location' | 'datetime'>('main');

  // Selection States
  const [selectedTreatment, setSelectedTreatment] = useState(initialQuery);
  const [selectedCategoryName, setSelectedCategoryName] = useState(initialCategoryName);
  const [selectedLocation, setSelectedLocation] = useState({
    address: currentLocation === "Lokacioni aktual" ? "" : currentLocation,
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);

  // Recents State
  const [recents, setRecents] = useState<string[]>([]);

  // Filter States
  const [treatmentQuery, setTreatmentQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState('All');

  // Dynamic Categories
  const [dbShops, setDbShops] = useState<any[]>([]);
  const [dbBarbers, setDbBarbers] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>(initialSubIds);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const autocompleteRef = useRef<any>(null);

  // Calendar States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 6, 22));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(22);

  // Animation Shared Values
  const treatmentX = useSharedValue(width);
  const locationX = useSharedValue(width);
  const datetimeX = useSharedValue(width);

  useEffect(() => {
    treatmentX.value = activePanel === 'treatment' ? 0 : width;
    locationX.value = activePanel === 'location' ? 0 : width;
    datetimeX.value = activePanel === 'datetime' ? 0 : width;
  }, [activePanel]);

  useEffect(() => {
    fetchRecents();
    loadSearchOptions();
  }, []);

  const loadSearchOptions = async () => {
    try {
      const { data: shopsData } = await supabase.from('barbershops').select('*').limit(30);
      if (shopsData) setDbShops(shopsData);

      const { data: barbersData } = await supabase.from('barbers').select('*').limit(30);
      if (barbersData) setDbBarbers(barbersData);
    } catch (e) {
      console.warn("Error loading database search options:", e);
    }
  };

  const fetchRecents = async () => {
    try {
      const { data: recentData } = await supabase
        .from('recent_searches')
        .select('category_name')
        .eq('user_id', USER_ID)
        .not('category_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentData) {
        const uniqueRecents = [...new Set(recentData.map(r => r.category_name).filter(Boolean))] as string[];
        setRecents(uniqueRecents.slice(0, 5));
      }
    } catch (e) {
      console.warn("Error fetching category recents from Supabase:", e);
    }
  };

  const saveRecentSearch = async (category: string) => {
    if (!category) return;
    const updatedRecents = [category, ...recents.filter(r => r !== category)].slice(0, 5);
    setRecents(updatedRecents);

    try {
      await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', USER_ID)
        .eq('category_name', category);

      await supabase.from('recent_searches').insert({
        user_id: USER_ID,
        category_name: category
      });
    } catch (e) {
      console.warn("Error saving category recent to Supabase:", e);
    }
  };

  const handleClearRecents = async () => {
    try {
      await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', USER_ID)
        .not('category_name', 'is', null);

      setRecents([]);
    } catch (e) {
      console.warn("Error clearing category recents from Supabase:", e);
    }
  };

  const treatmentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: treatmentX.value }] }));
  const locationStyle = useAnimatedStyle(() => ({ transform: [{ translateX: locationX.value }] }));
  const datetimeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: datetimeX.value }] }));

  const handleSearchTrigger = (query?: string) => {
    const finalQuery = query || selectedTreatment;
    if (finalQuery) {
      saveRecentSearch(finalQuery);
    }
    onSearch({
      query: finalQuery,
      city: selectedLocation.address || "Të gjitha",
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      date: selectedDate,
      time: selectedTime,
      subIds: selectedSubIds,
      categoryName: selectedCategoryName
    });
  };

  const filteredSubcategories = subcategories.filter(sub => 
    !treatmentQuery || sub.name?.toLowerCase().includes(treatmentQuery.toLowerCase())
  );
  
  const filteredShops = dbShops.filter(shop => 
    !treatmentQuery || shop.name?.toLowerCase().includes(treatmentQuery.toLowerCase())
  );
  
  const filteredBarbers = dbBarbers.filter(barber => 
    !treatmentQuery || barber.name?.toLowerCase().includes(treatmentQuery.toLowerCase())
  );

  const filteredTreatments = TREATMENTS.filter(t => t.toLowerCase().includes(treatmentQuery.toLowerCase()));

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
    setSelectedCalendarDay(null);
  };

  const handleDateSelect = (day: number) => {
    setSelectedCalendarDay(day);
    const dateStr = `${day} ${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    setSelectedDate(dateStr);
  };

  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const shiftedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < shiftedFirstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14%] h-10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = year === 2026 && month === 6 && d === 22;
      const isSelected = selectedCalendarDay === d;
      days.push(
        <TouchableOpacity
          key={d}
          onPress={() => handleDateSelect(d)}
          className={`w-[14%] h-10 items-center justify-center mb-2 rounded-full ${isSelected ? 'bg-[#6366f1]' : isToday ? 'bg-[#6366f1]/10 border border-[#6366f1]/30' : ''}`}
        >
          <Text className={`font-bold ${isSelected ? 'text-white' : isToday ? 'text-[#6366f1]' : 'text-[#161719]'}`}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const getTreatmentDisplay = () => {
    if (selectedTreatment) return selectedTreatment;
    if (selectedSubIds.length > 0) {
      if (selectedSubIds.length === 1) {
        return subcategories.find(s => s.id === selectedSubIds[0])?.name || "1 trajtim";
      }
      return `${selectedSubIds.length} trajtime të zgjedhura`;
    }
    return selectedCategoryName || "Any treatments, venues or professionals";
  };

  return (
    <View className="flex-1 bg-white">
      {/* --- MAIN PANEL --- */}
      <View className="flex-1">
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-2xl font-bold text-[#161719]">Kërko</Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={28} color="#161719" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="gap-y-3 mt-2">
            <TouchableOpacity
              onPress={() => setActivePanel('treatment')}
              className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm shadow-black/5"
            >
              <Search size={20} color={selectedTreatment || selectedCategoryName || selectedSubIds.length > 0 ? "#6366f1" : "#8789A3"} />
              <Text className={`flex-1 ml-3 text-base font-medium ${selectedTreatment || selectedCategoryName || selectedSubIds.length > 0 ? 'text-[#161719]' : 'text-[#8789A3]'}`}>
                {getTreatmentDisplay()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActivePanel('location')}
              className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm shadow-black/5"
            >
              <MapPin size={20} color={selectedLocation.address ? "#6366f1" : "#8789A3"} />
              <Text className={`flex-1 ml-3 text-base font-medium ${selectedLocation.address ? 'text-[#161719]' : 'text-[#8789A3]'}`}>
                {selectedLocation.address || "Current location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActivePanel('datetime')}
              className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm shadow-black/5"
            >
              <Calendar size={20} color={selectedDate !== 'Anytime' ? "#6366f1" : "#8789A3"} />
              <Text className={`flex-1 ml-3 text-base font-medium ${selectedDate !== 'Anytime' ? 'text-[#161719]' : 'text-[#8789A3]'}`}>
                {selectedDate === 'Anytime' ? 'Anytime' : `${selectedDate}${selectedTime !== 'Anytime' ? ` at ${selectedTime}` : ''}`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setSelectedTreatment("");
              setSelectedCategoryName("");
              setSelectedSubIds([]);
              setSelectedDate("Anytime");
              setSelectedTime("Anytime");
              setSelectedCalendarDay(null);
              setTreatmentQuery("");
              setSelectedLocation({
                address: "",
                lat: undefined,
                lng: undefined
              });

              // Sync with App.tsx global state without closing the modal
              onSearch({
                query: "",
                city: "Lokacioni aktual",
                lat: undefined,
                lng: undefined,
                date: "Anytime",
                time: "Anytime",
                subIds: [],
                categoryName: "",
                shouldClose: false
              });
            }}
            className="mt-4 self-start px-1"
          >
            <Text className="text-[#3473ef] font-bold text-sm underline">Pastro filtrat</Text>
          </TouchableOpacity>

          {recents.length > 0 && (
            <View className="mt-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-[#161719]">Recents</Text>
                <TouchableOpacity onPress={handleClearRecents}>
                  <Text className="text-[#6366f1] font-bold text-base">Clear</Text>
                </TouchableOpacity>
              </View>
              {recents.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSearchTrigger(item)}
                  className="flex-row items-center mb-4 active:opacity-75"
                >
                  <View className="w-10 h-10 rounded-full bg-[#6366f1]/10 items-center justify-center mr-4">
                    <Search size={20} color="#6366f1" />
                  </View>
                  <Text className="text-[17px] font-bold text-[#161719]">{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="mt-8">
            <Text className="text-xl font-bold text-[#161719] mb-4">Kategoritë</Text>
            <View className="flex-row flex-wrap justify-between">
              {categories.map((cat, i) => {
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
            </View>
          </View>
          <View className="h-32" />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-slate-50">
          <TouchableOpacity onPress={() => handleSearchTrigger()} className="bg-black h-16 rounded-full items-center justify-center shadow-xl">
            <Text className="text-white text-lg font-black">Kërko</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- TREATMENT PANEL --- */}
      <Animated.View style={[treatmentStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Kërko</Text>
        </View>
          <ScrollView className="flex-1 px-6">
            <View className="flex-row items-center border border-[#6366f1] rounded-2xl px-4 h-14 bg-white mb-6">
              <Search size={20} color="#8789A3" />
              <TextInput
                placeholder="Kërko"
                className="flex-1 ml-3 text-lg font-medium"
                value={treatmentQuery}
                onChangeText={setTreatmentQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              {['Të gjitha', 'Trajtimet', 'Sallonet', 'Profesionistët'].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setActiveFilterTab(p)}
                  className={`px-6 py-2.5 rounded-full mr-2 border ${activeFilterTab === p ? 'bg-black border-black' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-bold ${activeFilterTab === p ? 'text-white' : 'text-[#161719]'}`}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subcategories (Trajtimet) - Grouped by Category */}
            {(activeFilterTab === 'Të gjitha' || activeFilterTab === 'Trajtimet') && categories.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold">Trajtimet</Text>
                  {selectedSubIds.length > 0 && (
                    <TouchableOpacity onPress={() => setSelectedSubIds([])}>
                      <Text className="text-[#3473ef] font-bold">Pastro</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {categories.map((cat) => {
                  const catId = String(cat.id).trim();
                  const isExpanded = expandedCategories.includes(catId);
                  const catSubcategories = subcategories.filter(s => String(s.category_id).trim() === catId && (!treatmentQuery || s.name?.toLowerCase().includes(treatmentQuery.toLowerCase())));

                  if (catSubcategories.length === 0) return null;

                  const catSubIds = catSubcategories.map(s => String(s.id).trim());
                  const selectedCount = catSubIds.filter(id => selectedSubIds.includes(id)).length;
                  const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;

                  return (
                    <View key={catId} className="mb-4 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                      <TouchableOpacity
                        onPress={() => {
                          setExpandedCategories(prev =>
                            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
                          );
                        }}
                        className="flex-row items-center justify-between p-4"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3 shadow-sm shadow-slate-200">
                            <IconComponent size={20} color="#161719" strokeWidth={1.5} />
                          </View>
                          <Text className="text-[15px] font-bold text-[#161719] flex-1">{cat.name}</Text>
                          {selectedCount > 0 && (
                            <View className="bg-[#3473ef] px-2 py-0.5 rounded-full mr-3">
                              <Text className="text-white font-bold text-xs">{selectedCount}</Text>
                            </View>
                          )}
                        </View>
                        {isExpanded ? <ChevronUp size={20} color="#8789A3" /> : <ChevronDown size={20} color="#8789A3" />}
                      </TouchableOpacity>

                      {isExpanded && (
                        <View className="px-4 pb-4 bg-white border-t border-slate-100">
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedSubIds(prev => {
                                const allSelected = catSubIds.every(id => prev.includes(id));
                                if (allSelected) {
                                  return prev.filter(id => !catSubIds.includes(id));
                                } else {
                                  const newSelection = [...prev];
                                  catSubIds.forEach(id => {
                                    if (!newSelection.includes(id)) newSelection.push(id);
                                  });
                                  return newSelection;
                                }
                              });
                              setSelectedCategoryName("");
                              setSelectedTreatment("");
                            }}
                            className="flex-row items-center py-3 border-b border-slate-50"
                          >
                            <Text className={`font-black text-sm flex-1 ${catSubIds.length > 0 && catSubIds.every(id => selectedSubIds.includes(id)) ? 'text-[#3473ef]' : 'text-[#64748b]'}`}>Të gjitha në këtë kategori</Text>
                          </TouchableOpacity>

                          {catSubcategories.map((sub, sIdx) => {
                            const subId = String(sub.id).trim();
                            const isSelected = selectedSubIds.includes(subId);
                            return (
                              <TouchableOpacity
                                key={`${subId}-${sIdx}`}
                                onPress={() => {
                                  setSelectedSubIds(prev =>
                                    prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
                                  );
                                  setSelectedCategoryName("");
                                  setSelectedTreatment("");
                                }}
                                className="flex-row items-center py-3 border-b border-slate-50"
                              >
                                <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}`}>
                                  {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                                </View>
                                <Text className={`text-[14px] flex-1 ${isSelected ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}`}>{sub.name}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sallonet (Venues) */}
            {(activeFilterTab === 'Të gjitha' || activeFilterTab === 'Sallonet') && filteredShops.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold mb-4">Sallonet</Text>
                {filteredShops.map((shop, idx) => (
                  <TouchableOpacity key={shop.id || idx} onPress={() => {
                    setSelectedTreatment(shop.name);
                    setSelectedCategoryName("");
                    setSelectedSubIds([]);
                    setActivePanel('main');
                  }} className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-[#3473ef]/10 items-center justify-center mr-4">
                      <MapPin size={20} color="#3473ef" />
                    </View>
                    <View>
                      <Text className="text-[17px] font-bold text-[#161719]">{shop.name}</Text>
                      {shop.city && <Text className="text-xs text-gray-400 font-semibold">{shop.city}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Profesionistët (Barbers) */}
            {(activeFilterTab === 'Të gjitha' || activeFilterTab === 'Profesionistët') && filteredBarbers.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold mb-4">Profesionistët</Text>
                {filteredBarbers.map((barber, idx) => (
                  <TouchableOpacity key={barber.id || idx} onPress={() => {
                    setSelectedTreatment(barber.name);
                    setSelectedCategoryName("");
                    setSelectedSubIds([]);
                    setActivePanel('main');
                  }} className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-[#3473ef]/10 items-center justify-center mr-4">
                      <User size={20} color="#3473ef" />
                    </View>
                    <Text className="text-[17px] font-bold text-[#161719]">{barber.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Fallback to hardcoded list if database didn't return any values */}
            {filteredSubcategories.length === 0 && filteredShops.length === 0 && filteredBarbers.length === 0 && filteredTreatments.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold mb-4">Trajtimet</Text>
                {filteredTreatments.map((t) => (
                  <TouchableOpacity key={t} onPress={() => { setSelectedTreatment(t); setActivePanel('main'); }} className="flex-row items-center mb-6">
                    <View className="w-10 h-10 rounded-full bg-[#3473ef]/10 items-center justify-center mr-4">
                      <Scissors size={20} color="#3473ef" />
                    </View>
                    <Text className="text-[17px] font-bold text-[#161719]">{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View className="h-32" />
          </ScrollView>
        {activeFilterTab === 'Trajtimet' || activeFilterTab === 'Të gjitha' ? (
          <View className="p-6 border-t border-slate-100 bg-white">
            <TouchableOpacity
              onPress={() => setActivePanel('main')}
              className="bg-black h-14 rounded-2xl items-center justify-center shadow-lg"
            >
              <Text className="text-white font-black text-lg">
                Konfirmo {selectedSubIds.length > 0 ? `(${selectedSubIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>

      {/* --- LOCATION PANEL --- */}
      <Animated.View style={[locationStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Lokacioni</Text>
        </View>
        <View className="flex-1 px-6">
          <AddressAutocomplete
              placeholder="Kërko zonën, qytetin ose rrugën..."
              containerClassName="mb-6"
              onSelectAddress={(place) => {
                if (place?.formatted_address) {
                  Keyboard.dismiss();
                  setSelectedLocation({
                    address: place.formatted_address,
                    lat: place.latitude,
                    lng: place.longitude,
                    place_id: place.place_id
                  });
                  setActivePanel('main');
                }
              }}
          />

          <View className="flex-row items-start mt-8 mb-8 pr-4">
            <AlertCircle size={20} color="#8789A3" />
            <Text className="flex-1 ml-3 text-[#8789A3] text-[13px] leading-5 font-medium">
              Gjeni saktësisht se ku dëshironi të shkoni. Kërkoni sipas lagjes ose qytetit në Kosovë.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* --- DATE TIME PANEL --- */}
      <Animated.View style={[datetimeStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Data dhe ora</Text>
        </View>
        <ScrollView className="flex-1 px-6">
          <Text className="text-xl font-bold mb-4">Zgjidh ditën</Text>
          <View className="flex-row justify-between mb-8">
            <TouchableOpacity
              onPress={() => {
                setSelectedDate("Sot");
                setSelectedCalendarDay(22);
                setCurrentCalendarDate(new Date(2026, 6, 22));
              }}
              className={`border rounded-2xl p-6 items-center flex-1 ${selectedDate === "Sot" ? 'bg-[#6366f1]/5 border-[#6366f1]' : 'bg-white border-slate-200'} mr-2`}
            >
              <Text className={`text-lg font-bold ${selectedDate === "Sot" ? 'text-[#6366f1]' : 'text-[#161719]'}`}>Sot</Text>
              <Text className="text-[#8789A3]">Mër 22 Korrik</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedDate("Nesër");
                setSelectedCalendarDay(23);
                setCurrentCalendarDate(new Date(2026, 6, 22));
              }}
              className={`border rounded-2xl p-6 items-center flex-1 ${selectedDate === "Nesër" ? 'bg-[#6366f1]/5 border-[#6366f1]' : 'bg-white border-slate-200'} ml-2`}
            >
              <Text className={`text-lg font-bold ${selectedDate === "Nesër" ? 'text-[#6366f1]' : 'text-[#161719]'}`}>Nesër</Text>
              <Text className="text-[#8789A3]">Enj 23 Korrik</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8">
             <View className="flex-row items-center justify-between mb-6 px-2">
                <Text className="text-lg font-black text-[#161719]">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity onPress={handlePrevMonth} className="w-8 h-8 items-center justify-center bg-slate-50 rounded-full border border-slate-100"><ChevronLeft size={20} color="#161719" /></TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} className="w-8 h-8 items-center justify-center bg-slate-50 rounded-full border border-slate-100"><ChevronRight size={20} color="#161719" /></TouchableOpacity>
                </View>
             </View>
             <View className="flex-row flex-wrap justify-between w-full">
                {daysOfWeek.map(d => <Text key={d} className="w-[14%] text-center text-[#8789A3] mb-4 text-xs font-bold">{d}</Text>)}
                {renderCalendar()}
             </View>
          </View>

          <Text className="text-xl font-bold mb-4">Zgjidh orën</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
             {['Kurdoherë', 'Mëngjes', 'Pasdite', 'Mbrëmje'].map((t) => (
               <TouchableOpacity
                 key={t}
                 onPress={() => setSelectedTime(t)}
                 className={`px-6 py-4 rounded-2xl mr-3 border ${selectedTime === t ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-slate-200'}`}
               >
                 <Text className={`font-bold text-center ${selectedTime === t ? 'text-[#6366f1]' : '#161719'}`}>{t}</Text>
                 {t !== 'Kurdoherë' && <Text className="text-[10px] text-[#8789A3] mt-0.5">{t === 'Mëngjes' ? '09:00 - 12:00' : t === 'Pasdite' ? '12:00 - 18:00' : '18:00 - 00:00'}</Text>}
               </TouchableOpacity>
             ))}
          </ScrollView>
        </ScrollView>
        <View className="flex-row p-6 border-t border-slate-100">
           <TouchableOpacity onPress={() => setActivePanel('main')} className="flex-1 h-16 items-center justify-center mr-2"><Text className="text-lg font-bold">Anulo</Text></TouchableOpacity>
           <TouchableOpacity onPress={() => setActivePanel('main')} className="flex-[1.5] h-16 bg-black rounded-full items-center justify-center ml-2"><Text className="text-white text-lg font-black">Konfirmo</Text></TouchableOpacity>
        </View>
      </Animated.View>

{/* Subcategory Modal */}
    <Modal
      visible={showSubModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={() => setShowSubModal(false)}
        />
        <View className="bg-white rounded-t-[32px] h-[75%] overflow-hidden flex-col">
          <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
            <View className="flex-row items-center">
              <Text className="text-xl font-black text-[#161719]">Shërbimet</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSubModal(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#161719" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <View className="border-b border-slate-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              {categories.map(cat => {
                const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                const isSelected = selectedMainCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedMainCategory(cat)}
                    className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${isSelected ? 'bg-[#161719]' : 'bg-slate-100'}`}
                  >
                    <IconComponent size={14} color={isSelected ? "white" : "#64748b"} />
                    <Text className={`ml-2 text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} className="flex-1">
            <Text className="text-sm font-bold text-[#8789A3] mb-4">Zgjidhni shërbimet për këtë kategori:</Text>
            
            <TouchableOpacity
              onPress={() => {
                if (selectedMainCategory) {
                  const currentCategorySubIds = subcategories
                    .filter(s => String(s.category_id).trim() === String(selectedMainCategory.id).trim())
                    .map(s => String(s.id).trim());
                  
                  setSelectedSubIds(prev => {
                    const allSelected = currentCategorySubIds.every(id => prev.includes(id));
                    if (allSelected) {
                      // If all are selected, unselect them
                      return prev.filter(id => !currentCategorySubIds.includes(id));
                    } else {
                      // Select all
                      const newSelection = [...prev];
                      currentCategorySubIds.forEach(id => {
                        if (!newSelection.includes(id)) newSelection.push(id);
                      });
                      return newSelection;
                    }
                  });
                }
              }}
              className={`rounded-2xl py-4 items-center mb-4 border ${!selectedMainCategory || subcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}`}
            >
              <Text className={`font-black text-base ${!selectedMainCategory || subcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'text-[#3473ef]' : 'text-[#64748b]'}`}>Të gjitha në këtë kategori</Text>
            </TouchableOpacity>

            {selectedMainCategory && subcategories.filter(s => String(s.category_id).trim() === String(selectedMainCategory.id).trim()).map((sub, idx) => {
              const subId = String(sub.id).trim();
              const isSelected = selectedSubIds.includes(subId);
              return (
                <Pressable
                  key={`${subId}-${idx}`}
                  onPress={() => {
                    console.log("[Search] Toggling subcat:", subId);
                    setSelectedSubIds(prev =>
                      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
                    );
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: isSelected ? 'rgba(52, 115, 239, 0.3)' : '#F1F5F9',
                    opacity: pressed ? 0.7 : 1
                  })}
                >
                  <View className={`w-6 h-6 rounded-md border items-center justify-center mr-3 ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}`}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </View>
                  <Text className={`text-base flex-1 ${isSelected ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}`}>{sub.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sticky Bottom Button */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
            <TouchableOpacity
              onPress={() => {
                setShowSubModal(false);
                let finalSubIds = [...selectedSubIds];
                if (finalSubIds.length === 0 && selectedMainCategory) {
                  finalSubIds = subcategories
                    .filter(s => s.category_id === selectedMainCategory.id)
                    .map(s => s.id);
                }
                
                if (onSearch) {
                  onSearch({
                    query: "",
                    city: selectedLocation.address || currentLocation,
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng,
                    date: selectedDate,
                    time: selectedTime,
                    subIds: finalSubIds,
                    categoryName: selectedMainCategory?.name || ""
                  });
                }
              }}
              className="h-14 bg-black rounded-2xl items-center justify-center shadow-lg"
            >
              <Text className="text-white font-black text-lg">
                Kërko {selectedSubIds.length > 0 ? `(${selectedSubIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

</View>
  );
};
