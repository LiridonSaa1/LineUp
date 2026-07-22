import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, FlatList } from 'react-native';
import { X, Search, MapPin, Calendar, Grid, Scissors, Hand, Eye, Sparkles, User, Smile, Waves, ArrowLeft, ChevronRight, AlertCircle, Check, ChevronLeft } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { width } = Dimensions.get('window');

// IMPORTANT: Replace this with your actual Google Maps API Key
const GOOGLE_MAPS_KEY = 'YOUR_GOOGLE_API_KEY';

interface SearchScreenProps {
  onClose: () => void;
  onSearch: (filters: {
    query: string;
    city: string;
    lat?: number;
    lng?: number;
    date?: string;
    time?: string
  }) => void;
  currentLocation?: string;
}

const CATEGORIES = [
  { name: "All treatments", icon: Grid },
  { name: "Hair and styling", icon: Scissors },
  { name: "Nails", icon: Hand },
  { name: "Brows & lashes", icon: Eye },
  { name: "Hair removal", icon: Sparkles },
  { name: "Massage", icon: User },
  { name: "Facials", icon: Smile },
  { name: "Spa & sauna", icon: Waves },
  { name: "Barbering", icon: Scissors },
  { name: "Body", icon: User },
];

const TREATMENTS = ['Hair & styling', 'Nails', 'Hair removal', 'Massage', 'Facials', 'Barbering', 'Spa & sauna'];

export const SearchScreen: React.FC<SearchScreenProps> = ({ onClose, onSearch, currentLocation = "Current location" }) => {
  const [activePanel, setActivePanel] = useState<'main' | 'treatment' | 'location' | 'datetime'>('main');

  // Selection States
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    address: currentLocation === "Current location" ? "" : currentLocation,
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });
  const [selectedDate, setSelectedDate] = useState("Anytime");
  const [selectedTime, setSelectedTime] = useState("Anytime");

  // Filter States
  const [treatmentQuery, setTreatmentQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState('All');

  const autocompleteRef = useRef<any>(null);

  // Calendar States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 6, 22));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(22);

  // Animation Shared Values
  const treatmentX = useSharedValue(width);
  const locationX = useSharedValue(width);
  const datetimeX = useSharedValue(width);

  useEffect(() => {
    treatmentX.value = withSpring(activePanel === 'treatment' ? 0 : width, { damping: 20, stiffness: 100 });
    locationX.value = withSpring(activePanel === 'location' ? 0 : width, { damping: 20, stiffness: 100 });
    datetimeX.value = withSpring(activePanel === 'datetime' ? 0 : width, { damping: 20, stiffness: 100 });
  }, [activePanel]);

  const treatmentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: treatmentX.value }] }));
  const locationStyle = useAnimatedStyle(() => ({ transform: [{ translateX: locationX.value }] }));
  const datetimeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: datetimeX.value }] }));

  const handleSearchTrigger = (query?: string) => {
    onSearch({
      query: query || selectedTreatment,
      city: selectedLocation.address || "Të gjitha",
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      date: selectedDate,
      time: selectedTime
    });
  };

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

  return (
    <View className="flex-1 bg-white">
      {/* --- MAIN PANEL --- */}
      <View className="flex-1">
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-2xl font-bold text-[#161719]">Search</Text>
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
              <Search size={20} color={selectedTreatment ? "#6366f1" : "#8789A3"} />
              <Text className={`flex-1 ml-3 text-base font-medium ${selectedTreatment ? 'text-[#161719]' : 'text-[#8789A3]'}`}>
                {selectedTreatment || "Any treatments, venues or professionals"}
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

          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#161719]">Recents</Text>
              <TouchableOpacity><Text className="text-[#6366f1] font-bold text-base">Clear</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleSearchTrigger("Hair & styling")} className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-[#6366f1]/10 items-center justify-center mr-4">
                <Search size={20} color="#6366f1" />
              </View>
              <Text className="text-[17px] font-bold text-[#161719]">Hair & styling</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Text className="text-xl font-bold text-[#161719] mb-4">Categories</Text>
            <View className="flex-row flex-wrap justify-between">
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSearchTrigger(cat.name)}
                  className="bg-slate-50 border border-slate-100 rounded-2xl items-center justify-center py-6 mb-4"
                  style={{ width: (width - 60) / 2 }}
                >
                  <cat.icon size={32} color="#161719" strokeWidth={1.5} />
                  <Text className="text-[13px] font-bold text-[#161719] mt-3 text-center px-2">{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View className="h-32" />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-slate-50">
          <TouchableOpacity onPress={() => handleSearchTrigger()} className="bg-black h-16 rounded-full items-center justify-center shadow-xl">
            <Text className="text-white text-lg font-black">Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- TREATMENT PANEL --- */}
      <Animated.View style={[treatmentStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Search</Text>
        </View>
        <ScrollView className="flex-1 px-6">
          <View className="flex-row items-center border border-[#6366f1] rounded-2xl px-4 h-14 bg-white mb-6">
            <Search size={20} color="#8789A3" />
            <TextInput
              placeholder="Search"
              className="flex-1 ml-3 text-lg font-medium"
              value={treatmentQuery}
              onChangeText={setTreatmentQuery}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            {['All', 'Treatments', 'Venues', 'Professionals'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setActiveFilterTab(p)}
                className={`px-6 py-2.5 rounded-full mr-2 border ${activeFilterTab === p ? 'bg-black border-black' : 'bg-white border-slate-200'}`}
              >
                <Text className={`font-bold ${activeFilterTab === p ? 'text-white' : 'text-[#161719]'}`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredTreatments.length > 0 && (
            <>
              <Text className="text-xl font-bold mb-4">Treatments</Text>
              {filteredTreatments.map((t) => (
                <TouchableOpacity key={t} onPress={() => { setSelectedTreatment(t); setActivePanel('main'); }} className="flex-row items-center mb-6">
                  <View className="w-10 h-10 rounded-full bg-[#6366f1]/5 items-center justify-center mr-4">
                    <Scissors size={20} color="#6366f1" opacity={0.6} />
                  </View>
                  <Text className="text-[17px] font-bold">{t}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* --- LOCATION PANEL --- */}
      <Animated.View style={[locationStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Location</Text>
        </View>
        <View className="flex-1 px-6">
           <GooglePlacesAutocomplete
              ref={autocompleteRef}
              placeholder='Search for area, city...'
              fetchDetails={true}
              onPress={(data, details = null) => {
                setSelectedLocation({
                  address: data.description,
                  lat: details?.geometry?.location?.lat,
                  lng: details?.geometry?.location?.lng
                });
                setActivePanel('main');
              }}
              query={{
                key: GOOGLE_MAPS_KEY,
                language: 'sq',
                components: 'country:ks',
              }}
              styles={{
                container: { flex: 0, marginBottom: 20 },
                textInputContainer: {
                  backgroundColor: 'white',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#6366f1',
                  paddingHorizontal: 8
                },
                textInput: { height: 54, fontSize: 16, color: '#161719', fontWeight: '500' },
                listView: { backgroundColor: 'white', borderRadius: 20, marginTop: 10, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
                row: { padding: 15, height: 60, flexDirection: 'row' },
                separator: { height: 1, backgroundColor: '#F1F5F9' },
                description: { fontSize: 15, color: '#161719' },
              }}
              renderLeftButton={() => <View className="justify-center pl-2"><Search size={20} color="#6366f1" /></View>}
           />

          <View className="flex-row items-start mb-8 pr-4">
            <AlertCircle size={20} color="#8789A3" />
            <Text className="flex-1 ml-3 text-[#8789A3] text-[13px] leading-5 font-medium">
              Find exactly where you want to go. Search by neighborhood or city in Kosovo.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* --- DATE TIME PANEL --- */}
      <Animated.View style={[datetimeStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Date and time</Text>
        </View>
        <ScrollView className="flex-1 px-6">
          <Text className="text-xl font-bold mb-4">Select day</Text>
          <View className="flex-row justify-between mb-8">
            <TouchableOpacity
              onPress={() => {
                setSelectedDate("Today");
                setSelectedCalendarDay(22);
                setCurrentCalendarDate(new Date(2026, 6, 22));
              }}
              className={`border rounded-2xl p-6 items-center flex-1 ${selectedDate === "Today" ? 'bg-[#6366f1]/5 border-[#6366f1]' : 'bg-white border-slate-200'} mr-2`}
            >
              <Text className={`text-lg font-bold ${selectedDate === "Today" ? 'text-[#6366f1]' : 'text-[#161719]'}`}>Today</Text>
              <Text className="text-[#8789A3]">Wed 22 July</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedDate("Tomorrow");
                setSelectedCalendarDay(23);
                setCurrentCalendarDate(new Date(2026, 6, 22));
              }}
              className={`border rounded-2xl p-6 items-center flex-1 ${selectedDate === "Tomorrow" ? 'bg-[#6366f1]/5 border-[#6366f1]' : 'bg-white border-slate-200'} ml-2`}
            >
              <Text className={`text-lg font-bold ${selectedDate === "Tomorrow" ? 'text-[#6366f1]' : 'text-[#161719]'}`}>Tomorrow</Text>
              <Text className="text-[#8789A3]">Thu 23 July</Text>
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

          <Text className="text-xl font-bold mb-4">Select time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
             {['Anytime', 'Morning', 'Afternoon', 'Evening'].map((t) => (
               <TouchableOpacity
                 key={t}
                 onPress={() => setSelectedTime(t)}
                 className={`px-6 py-4 rounded-2xl mr-3 border ${selectedTime === t ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-slate-200'}`}
               >
                 <Text className={`font-bold text-center ${selectedTime === t ? 'text-[#6366f1]' : '#161719'}`}>{t}</Text>
                 {t !== 'Anytime' && <Text className="text-[10px] text-[#8789A3] mt-0.5">{t === 'Morning' ? '09:00 - 12:00' : t === 'Afternoon' ? '12:00 - 18:00' : '18:00 - 00:00'}</Text>}
               </TouchableOpacity>
             ))}
          </ScrollView>
        </ScrollView>
        <View className="flex-row p-6 border-t border-slate-100">
           <TouchableOpacity onPress={() => setActivePanel('main')} className="flex-1 h-16 items-center justify-center mr-2"><Text className="text-lg font-bold">Cancel</Text></TouchableOpacity>
           <TouchableOpacity onPress={() => setActivePanel('main')} className="flex-[1.5] h-16 bg-black rounded-full items-center justify-center ml-2"><Text className="text-white text-lg font-black">Confirm</Text></TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};
