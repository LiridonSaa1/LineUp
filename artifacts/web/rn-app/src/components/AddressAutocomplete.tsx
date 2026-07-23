import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { MapPin, Search, Check, AlertCircle, Navigation } from 'lucide-react-native';

export interface PlaceDetails {
  formatted_address: string;
  city: string;
  street: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface AddressAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  onSelectAddress: (place: PlaceDetails) => void;
  label?: string;
  inputClassName?: string;
  containerClassName?: string;
  apiKey?: string;
  countryCode?: string;
  disabled?: boolean;
}

const DEFAULT_GOOGLE_MAPS_KEY = 'AIzaSyD9DOb-ko2C84TUlBVuPVILNaf3Jhkl-yg';

// Comprehensive Kosovo Places Database for Instant Local Fallback & Offline Autocomplete
export const KOSOVO_LOCATIONS: PlaceDetails[] = [
  { formatted_address: "Prishtinë, Qendër, Kosovë", city: "Prishtinë", street: "Sheshi Nënë Tereza", postal_code: "10000", country: "Kosovë", latitude: 42.6629, longitude: 21.1655 },
  { formatted_address: "Prishtinë - Dardania, Kosovë", city: "Prishtinë", street: "Bulevardi Bill Clinton", postal_code: "10000", country: "Kosovë", latitude: 42.6550, longitude: 21.1520 },
  { formatted_address: "Prishtinë - Bregu i Diellit, Kosovë", city: "Prishtinë", street: "Rruga Enver Maloku", postal_code: "10000", country: "Kosovë", latitude: 42.6580, longitude: 21.1750 },
  { formatted_address: "Prishtinë - Rruga B, Kosovë", city: "Prishtinë", street: "Rruga B", postal_code: "10000", country: "Kosovë", latitude: 42.6560, longitude: 21.1820 },
  { formatted_address: "Prishtinë - Rruga C, Kosovë", city: "Prishtinë", street: "Rruga C", postal_code: "10000", country: "Kosovë", latitude: 42.6500, longitude: 21.1850 },
  { formatted_address: "Prishtinë - Pejton, Kosovë", city: "Prishtinë", street: "Rruga Fehmi Agani", postal_code: "10000", country: "Kosovë", latitude: 42.6590, longitude: 21.1580 },
  { formatted_address: "Prishtinë - Arbëri (Dragodan), Kosovë", city: "Prishtinë", street: "Rruga Ahmet Krasniqi", postal_code: "10000", country: "Kosovë", latitude: 42.6680, longitude: 21.1550 },
  { formatted_address: "Prishtinë - Ulpianë, Kosovë", city: "Prishtinë", street: "Rruga Henry Dunant", postal_code: "10000", country: "Kosovë", latitude: 42.6510, longitude: 21.1610 },
  { formatted_address: "Prizren, Qendër / Shatërvan, Kosovë", city: "Prizren", street: "Sheshi Shatërvan", postal_code: "20000", country: "Kosovë", latitude: 42.2139, longitude: 20.7397 },
  { formatted_address: "Prizren - Bazhdarhane, Kosovë", city: "Prizren", street: "Rruga Remzi Ademaj", postal_code: "20000", country: "Kosovë", latitude: 42.2200, longitude: 20.7420 },
  { formatted_address: "Pejë, Qendër, Kosovë", city: "Pejë", street: "Sheshi Haxhi Zeka", postal_code: "30000", country: "Kosovë", latitude: 42.6593, longitude: 20.2883 },
  { formatted_address: "Pejë - Karagaç, Kosovë", city: "Pejë", street: "Rruga Mbretëresha Teutë", postal_code: "30000", country: "Kosovë", latitude: 42.6540, longitude: 20.2910 },
  { formatted_address: "Gjakovë, Qarshia e Madhe, Kosovë", city: "Gjakovë", street: "Rruga Qarshia e Madhe", postal_code: "50000", country: "Kosovë", latitude: 42.3803, longitude: 20.4308 },
  { formatted_address: "Gjilan, Qendër, Kosovë", city: "Gjilan", street: "Bulevardi i Pavarësisë", postal_code: "60000", country: "Kosovë", latitude: 42.4635, longitude: 21.4678 },
  { formatted_address: "Mitrovicë, Qendër, Kosovë", city: "Mitrovicë", street: "Sheshi Mehë Uka", postal_code: "40000", country: "Kosovë", latitude: 42.8914, longitude: 20.8660 },
  { formatted_address: "Ferizaj, Qendër, Kosovë", city: "Ferizaj", street: "Rruga Dëshmorët e Kombit", postal_code: "70000", country: "Kosovë", latitude: 42.3703, longitude: 21.1559 },
  { formatted_address: "Vushtrri, Qendër, Kosovë", city: "Vushtrri", street: "Rruga Ismail Qemali", postal_code: "42000", country: "Kosovë", latitude: 42.8231, longitude: 20.9675 },
  { formatted_address: "Podujevë, Qendër, Kosovë", city: "Podujevë", street: "Rruga Zahir Pajaziti", postal_code: "11000", country: "Kosovë", latitude: 42.9114, longitude: 21.1903 },
  { formatted_address: "Fushë Kosovë, Qendër, Kosovë", city: "Fushë Kosovë", street: "Rruga Nënë Tereza", postal_code: "12000", country: "Kosovë", latitude: 42.6340, longitude: 21.0963 },
  { formatted_address: "Rahovec, Qendër, Kosovë", city: "Rahovec", street: "Rruga Xhelal Hajda", postal_code: "21000", country: "Kosovë", latitude: 42.3994, longitude: 20.6553 },
  { formatted_address: "Skënderaj, Qendër, Kosovë", city: "Skënderaj", street: "Rruga Adem Jashari", postal_code: "41000", country: "Kosovë", latitude: 42.7478, longitude: 20.7878 },
  { formatted_address: "Lipjan, Qendër, Kosovë", city: "Lipjan", street: "Rruga Lidhja e Prizrenit", postal_code: "14000", country: "Kosovë", latitude: 42.5217, longitude: 21.1258 },
  { formatted_address: "Suharekë, Qendër, Kosovë", city: "Suharekë", street: "Rruga Skënderbeu", postal_code: "23000", country: "Kosovë", latitude: 42.3581, longitude: 20.8250 },
];

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder = "Kërko zonën, qytetin ose rrugën...",
  initialValue = "",
  onSelectAddress,
  label,
  inputClassName = "",
  containerClassName = "",
  apiKey = DEFAULT_GOOGLE_MAPS_KEY,
  countryCode = "xk",
  disabled = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Instant local Kosovo filter
    const localMatches = KOSOVO_LOCATIONS.filter(item =>
      item.formatted_address.toLowerCase().includes(text.toLowerCase()) ||
      item.city.toLowerCase().includes(text.toLowerCase()) ||
      item.street.toLowerCase().includes(text.toLowerCase())
    );

    setSuggestions(localMatches);
    setIsOpen(true);

    // Online Google Places Autocomplete API query
    if (text.trim().length >= 2) {
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              text
            )}&key=${apiKey}&components=country:${countryCode}&language=sq`
          );
          const data = await response.json();

          if (data.status === 'OK' && Array.isArray(data.predictions)) {
            const googlePlaces: PlaceDetails[] = data.predictions.map((p: any) => ({
              formatted_address: p.description,
              city: p.structured_formatting?.secondary_text?.split(',')[0] || "Kosovë",
              street: p.structured_formatting?.main_text || p.description,
              postal_code: "",
              country: "Kosovë",
            }));

            // Merge local and Google API results uniquely
            const combined = [...localMatches];
            googlePlaces.forEach(gp => {
              if (!combined.some(c => c.formatted_address.toLowerCase() === gp.formatted_address.toLowerCase())) {
                combined.push(gp);
              }
            });
            setSuggestions(combined);
          }
        } catch (err) {
          console.warn("Google Places fetch error:", err);
          // Fallback gracefully to local matches
        } finally {
          setLoading(false);
        }
      }, 300);
    }
  };

  const handleSelectSuggestion = async (item: PlaceDetails) => {
    setQuery(item.formatted_address);
    setIsOpen(false);
    setSuggestions([]);
    onSelectAddress(item);
  };

  return (
    <View className={`relative z-50 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-2 ml-1">
          {label}
        </Text>
      )}

      <View className="relative flex-row items-center">
        <View className="absolute left-4 z-10">
          <MapPin size={20} color="#3473ef" />
        </View>

        <TextInput
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#8789A3"
          disabled={disabled}
          className={`w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 h-14 text-base font-bold text-[#161719] shadow-xs ${inputClassName}`}
        />

        {loading && (
          <View className="absolute right-4 z-10">
            <ActivityIndicator size="small" color="#3473ef" />
          </View>
        )}
      </View>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <View className="mt-2 bg-white rounded-3xl border border-slate-200 p-2 shadow-2xl z-50 max-h-60 overflow-hidden">
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
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
                    📍 {item.city} • {item.country}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
