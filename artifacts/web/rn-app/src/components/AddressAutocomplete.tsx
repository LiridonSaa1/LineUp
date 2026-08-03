import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { MapPin, X, Navigation, Check } from 'lucide-react-native';

export interface PlaceDetails {
  formatted_address: string;
  city: string;
  street: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  is_selected?: boolean;
}

export interface AddressAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  onSelectAddress: (place: PlaceDetails | null) => void;
  label?: string;
  inputClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  selectedCity?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder = "Kërko adresën (p.sh. Rruga Gjon Serreçi, Ferizaj)...",
  initialValue = "",
  onSelectAddress,
  label,
  inputClassName = "",
  containerClassName = "",
  disabled = false,
  selectedCity,
}) => {
  const [query, setQuery] = useState(initialValue || "");
  const [suggestions, setSuggestions] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<PlaceDetails | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialValue || "");
  }, [initialValue]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setIsSelected(false);
    setSelectedItem(null);
    onSelectAddress(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Build a more structured query for OSM
        // Using "q" parameter with city name appended for better accuracy
        const searchTerm = selectedCity
          ? `${text}, ${selectedCity}, Kosovë`
          : `${text}, Kosovë`;

        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=8&countrycodes=xk&accept-language=sq`,
          { headers: { 'User-Agent': 'LineUpApp/1.0' } }
        );
        const osmData = await osmRes.json();

        if (Array.isArray(osmData)) {
          const results = osmData.map((item: any) => {
            const addr = item.address || {};
            const street = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
            const city = addr.city || addr.town || addr.village || addr.municipality || selectedCity || "Kosovë";

            // Create a clean, short address
            let shortAddr = street;
            if (shortAddr && city && !shortAddr.includes(city)) {
              shortAddr += `, ${city}`;
            } else if (!shortAddr) {
              shortAddr = item.display_name.split(',')[0];
            }

            return {
              formatted_address: shortAddr,
              city: city,
              street: street,
              postal_code: addr.postcode || "",
              country: "Kosovë",
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              place_id: `osm_${item.place_id || item.osm_id}`,
            };
          });
          setSuggestions(results);
          setIsOpen(results.length > 0);
        }
      } catch (err) {
        console.warn("[AddressAutocomplete] OSM error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (item: PlaceDetails) => {
    setIsOpen(false);
    setSuggestions([]);
    setIsSelected(true);
    setSelectedItem(item);
    setQuery(item.formatted_address);
    onSelectAddress({ ...item, is_selected: true });
    Keyboard.dismiss();
  };

  return (
    <View className={`relative z-50 ${containerClassName}`} style={{ zIndex: 9999, elevation: 10 }}>
      {label && (
        <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-2 ml-1">
          {label}
        </Text>
      )}

      <View className="relative flex-row items-center">
        <View className="absolute left-4 z-10">
          <MapPin size={20} color={isSelected ? "#10b981" : "#3473ef"} />
        </View>

        <TextInput
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#8789A3"
          editable={!disabled}
          className={`w-full bg-white border ${isSelected ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200'} rounded-2xl pl-12 pr-10 h-14 text-sm font-bold text-[#161719] shadow-xs ${inputClassName}`}
        />

        <View className="absolute right-4 z-10 flex-row items-center gap-2">
          {loading && <ActivityIndicator size="small" color="#3473ef" />}
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setIsSelected(false);
                setSelectedItem(null);
                setSuggestions([]);
                setIsOpen(false);
                onSelectAddress(null);
                Keyboard.dismiss();
              }}
              className="p-1"
            >
              <X size={18} color="#8789A3" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isOpen && suggestions.length > 0 && (
        <View
          className="absolute top-16 left-0 right-0 bg-white rounded-3xl border border-slate-200 p-2 shadow-2xl overflow-hidden"
          style={{ zIndex: 99999, elevation: 25 }}
        >
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectSuggestion(item)}
              className="flex-row items-center p-3.5 rounded-2xl border-b border-slate-50 active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-full bg-[#3473ef]/10 items-center justify-center mr-3">
                <Navigation size={16} color="#3473ef" />
              </View>
              <View className="flex-1">
                <Text className="text-[#161719] font-black text-sm" numberOfLines={1}>
                  {item.formatted_address}
                </Text>
                <Text className="text-[#8789A3] font-bold text-[11px] mt-0.5">
                  📍 {item.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
