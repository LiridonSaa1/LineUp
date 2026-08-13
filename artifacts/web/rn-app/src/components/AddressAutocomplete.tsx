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
  onChangeText?: (text: string) => void;
  label?: string;
  inputClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  selectedCity?: string;
  cityCoords?: { lat: number, lng: number };
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder = "Kërko adresën (p.sh. Rruga Gjon Serreçi, Ferizaj)...",
  initialValue = "",
  onSelectAddress,
  onChangeText,
  label,
  inputClassName = "",
  containerClassName = "",
  disabled = false,
  selectedCity,
  cityCoords,
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

  // Sync with selectedCity: Clear address when city changes
  useEffect(() => {
    setQuery("");
    setSuggestions([]);
    setIsSelected(false);
    setSelectedItem(null);
    setIsOpen(false);
    onSelectAddress(null);
  }, [selectedCity]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setIsSelected(false);
    setSelectedItem(null);
    onSelectAddress(null);
    if (onChangeText) onChangeText(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Capture these values now to avoid potential ReferenceErrors inside the timeout callback
    // (especially common in Hermes engine with certain async patterns)
    const currentCity = selectedCity;
    const currentCoords = cityCoords;

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // STRATEGY: Append city name to the search term for much better precision.
        // If selectedCity is "Ferizaj" and user types "Gjon", we search "Gjon, Ferizaj"
        const searchTerm = currentCity ? `${text.trim()}, ${currentCity}` : text.trim();

        // countrycodes=xk for Kosovo
        // dedupe=1 to remove duplicates
        // accept-language: sq first, then en
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=12&accept-language=sq,en;q=0.8&countrycodes=xk&dedupe=1`;

        // If we have city coordinates, we "hard-lock" the search to this city area.
        // This ensures "Rruga B" returns results in Prishtinë, not some other town.
        if (currentCoords) {
          const delta = 0.12; // ~12km box, perfect for Kosovo urban centers
          const viewbox = `${currentCoords.lng - delta},${currentCoords.lat + delta},${currentCoords.lng + delta},${currentCoords.lat - delta}`;
          url += `&viewbox=${viewbox}&bounded=1`;
        }

        const osmRes = await fetch(url, {
          headers: {
            'User-Agent': 'LineUpApp-Mobile/1.2 (contact: info@lineup.ks)',
          }
        });

        if (!osmRes.ok) throw new Error(`OSM status: ${osmRes.status}`);

        const osmData = await osmRes.json();

        if (Array.isArray(osmData)) {
          const results = osmData.map((item: any) => {
            const addr = item.address || {};

            // Expanded list of OSM tags that can represent a "street" or "location name"
            const street = addr.road || addr.pedestrian || addr.cycleway || addr.footway ||
                           addr.path || addr.square || addr.plaza || addr.neighbourhood ||
                           addr.suburb || addr.hamlet || addr.allotments || addr.place || "";

            const houseNumber = addr.house_number || addr.house_name || "";
            const city = addr.city || addr.town || addr.village || addr.municipality || selectedCity || "";

            // Build a readable address string
            let shortAddr = street;
            if (houseNumber) {
              shortAddr = `${street} ${houseNumber}`.trim();
            }

            // Fallback for missing street tags
            if (!shortAddr || shortAddr.length < 3) {
              shortAddr = item.display_name.split(',')[0].trim();
            }

            // Clean up city redundancy (e.g. "Rruga B, Prishtinë, Prishtinë" -> "Rruga B, Prishtinë")
            let finalFormatted = shortAddr;
            if (city && !finalFormatted.toLowerCase().includes(city.toLowerCase())) {
              finalFormatted = `${shortAddr}, ${city}`;
            }

            return {
              formatted_address: finalFormatted,
              city: city,
              street: street || shortAddr,
              postal_code: addr.postcode || "",
              country: addr.country || "Kosovë",
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              place_id: `osm_${item.place_id || item.osm_id}`,
            };
          });

          // Deduplication based on formatted address
          const uniqueResults = results.filter((v, i, a) =>
            a.findIndex(t => t.formatted_address.toLowerCase() === v.formatted_address.toLowerCase()) === i
          );

          setSuggestions(uniqueResults);
          setIsOpen(uniqueResults.length > 0);
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
    <View className={`relative ${containerClassName}`} style={{ zIndex: isOpen ? 9999 : 1, elevation: isOpen ? 10 : 1 }}>
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
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
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
          className="absolute top-[60] left-0 right-0 bg-white rounded-3xl border border-slate-200 p-2 shadow-2xl overflow-hidden"
          style={{ zIndex: 10000, elevation: 20 }}
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
