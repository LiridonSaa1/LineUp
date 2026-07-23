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
  selectedCity?: string;
}

const DEFAULT_GOOGLE_MAPS_KEY = 'AIzaSyD9DOb-ko2C84TUlBVuPVILNaf3Jhkl-yg';

// Normalizer for Albanian characters (ë -> e, ç -> c)
const normalizeStr = (str: string) =>
  str
    ? str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ë/g, "e")
        .replace(/ç/g, "c")
    : "";

// Clean Kosovo Municipalities for City Autocomplete
export const KOSOVO_CITIES: PlaceDetails[] = [
  { formatted_address: "Ferizaj", city: "Ferizaj", street: "", postal_code: "70000", country: "Kosovë", latitude: 42.3703, longitude: 21.1559 },
  { formatted_address: "Prishtinë", city: "Prishtinë", street: "", postal_code: "10000", country: "Kosovë", latitude: 42.6629, longitude: 21.1655 },
  { formatted_address: "Prizren", city: "Prizren", street: "", postal_code: "20000", country: "Kosovë", latitude: 42.2139, longitude: 20.7397 },
  { formatted_address: "Pejë", city: "Pejë", street: "", postal_code: "30000", country: "Kosovë", latitude: 42.6593, longitude: 20.2883 },
  { formatted_address: "Gjakovë", city: "Gjakovë", street: "", postal_code: "50000", country: "Kosovë", latitude: 42.3803, longitude: 20.4308 },
  { formatted_address: "Gjilan", city: "Gjilan", street: "", postal_code: "60000", country: "Kosovë", latitude: 42.4635, longitude: 21.4678 },
  { formatted_address: "Mitrovicë", city: "Mitrovicë", street: "", postal_code: "40000", country: "Kosovë", latitude: 42.8914, longitude: 20.8660 },
  { formatted_address: "Vushtrri", city: "Vushtrri", street: "", postal_code: "42000", country: "Kosovë", latitude: 42.8231, longitude: 20.9675 },
  { formatted_address: "Podujevë", city: "Podujevë", street: "", postal_code: "11000", country: "Kosovë", latitude: 42.9114, longitude: 21.1903 },
  { formatted_address: "Fushë Kosovë", city: "Fushë Kosovë", street: "", postal_code: "12000", country: "Kosovë", latitude: 42.6340, longitude: 21.0963 },
  { formatted_address: "Rahovec", city: "Rahovec", street: "", postal_code: "21000", country: "Kosovë", latitude: 42.3994, longitude: 20.6553 },
  { formatted_address: "Skënderaj", city: "Skënderaj", street: "", postal_code: "41000", country: "Kosovë", latitude: 42.7478, longitude: 20.7878 },
  { formatted_address: "Lipjan", city: "Lipjan", street: "", postal_code: "14000", country: "Kosovë", latitude: 42.5217, longitude: 21.1258 },
  { formatted_address: "Suharekë", city: "Suharekë", street: "", postal_code: "23000", country: "Kosovë", latitude: 42.3581, longitude: 20.8250 },
  { formatted_address: "Deçan", city: "Deçan", street: "", postal_code: "51000", country: "Kosovë", latitude: 42.5353, longitude: 20.2878 },
  { formatted_address: "Istog", city: "Istog", street: "", postal_code: "31000", country: "Kosovë", latitude: 42.7808, longitude: 20.4875 },
  { formatted_address: "Klinë", city: "Klinë", street: "", postal_code: "32000", country: "Kosovë", latitude: 42.6225, longitude: 20.5786 },
];

export const KOSOVO_STREETS: Record<string, PlaceDetails[]> = {
  "Ferizaj": [
    { formatted_address: "Ferizaj - Rruga Dëshmorët e Kombit", city: "Ferizaj", street: "Rruga Dëshmorët e Kombit", postal_code: "70000", country: "Kosovë", latitude: 42.3703, longitude: 21.1559 },
    { formatted_address: "Ferizaj - Rruga 12 Qershori", city: "Ferizaj", street: "Rruga 12 Qershori", postal_code: "70000", country: "Kosovë", latitude: 42.3685, longitude: 21.1540 },
    { formatted_address: "Ferizaj - Rruga Ahmet Kaçiku", city: "Ferizaj", street: "Rruga Ahmet Kaçiku", postal_code: "70000", country: "Kosovë", latitude: 42.3720, longitude: 21.1580 },
    { formatted_address: "Ferizaj - Rruga Reçaku", city: "Ferizaj", street: "Rruga Reçaku", postal_code: "70000", country: "Kosovë", latitude: 42.3650, longitude: 21.1500 },
    { formatted_address: "Ferizaj - Rruga Nerodime", city: "Ferizaj", street: "Rruga Nerodime", postal_code: "70000", country: "Kosovë", latitude: 42.3600, longitude: 21.1450 },
    { formatted_address: "Ferizaj - Sheshi Adem Jashari", city: "Ferizaj", street: "Sheshi Adem Jashari", postal_code: "70000", country: "Kosovë", latitude: 42.3700, longitude: 21.1550 },
  ],
  "Prishtinë": [
    { formatted_address: "Prishtinë - Rruga B", city: "Prishtinë", street: "Rruga B", postal_code: "10000", country: "Kosovë", latitude: 42.6560, longitude: 21.1820 },
    { formatted_address: "Prishtinë - Rruga C", city: "Prishtinë", street: "Rruga C", postal_code: "10000", country: "Kosovë", latitude: 42.6500, longitude: 21.1850 },
    { formatted_address: "Prishtinë - Dardania (Bill Clinton)", city: "Prishtinë", street: "Bulevardi Bill Clinton", postal_code: "10000", country: "Kosovë", latitude: 42.6550, longitude: 21.1520 },
    { formatted_address: "Prishtinë - Bregu i Diellit (Enver Maloku)", city: "Prishtinë", street: "Rruga Enver Maloku", postal_code: "10000", country: "Kosovë", latitude: 42.6580, longitude: 21.1750 },
    { formatted_address: "Prishtinë - Pejton (Fehmi Agani)", city: "Prishtinë", street: "Rruga Fehmi Agani", postal_code: "10000", country: "Kosovë", latitude: 42.6590, longitude: 21.1580 },
    { formatted_address: "Prishtinë - Dragodan / Arbëri", city: "Prishtinë", street: "Rruga Ahmet Krasniqi", postal_code: "10000", country: "Kosovë", latitude: 42.6680, longitude: 21.1550 },
    { formatted_address: "Prishtinë - Ulpianë", city: "Prishtinë", street: "Rruga Henry Dunant", postal_code: "10000", country: "Kosovë", latitude: 42.6510, longitude: 21.1610 },
  ],
  "Prizren": [
    { formatted_address: "Prizren - Sheshi Shatërvan", city: "Prizren", street: "Sheshi Shatërvan", postal_code: "20000", country: "Kosovë", latitude: 42.2139, longitude: 20.7397 },
    { formatted_address: "Prizren - Bazhdarhane", city: "Prizren", street: "Rruga Remzi Ademaj", postal_code: "20000", country: "Kosovë", latitude: 42.2200, longitude: 20.7420 },
    { formatted_address: "Prizren - Rruga Adem Jashari", city: "Prizren", street: "Rruga Adem Jashari", postal_code: "20000", country: "Kosovë", latitude: 42.2180, longitude: 20.7410 },
  ],
  "Pejë": [
    { formatted_address: "Pejë - Sheshi Haxhi Zeka", city: "Pejë", street: "Sheshi Haxhi Zeka", postal_code: "30000", country: "Kosovë", latitude: 42.6593, longitude: 20.2883 },
    { formatted_address: "Pejë - Karagaç", city: "Pejë", street: "Rruga Mbretëresha Teutë", postal_code: "30000", country: "Kosovë", latitude: 42.6540, longitude: 20.2910 },
  ],
  "Gjakovë": [
    { formatted_address: "Gjakovë - Qarshia e Madhe", city: "Gjakovë", street: "Rruga Qarshia e Madhe", postal_code: "50000", country: "Kosovë", latitude: 42.3803, longitude: 20.4308 },
    { formatted_address: "Gjakovë - Rruga Nënë Tereza", city: "Gjakovë", street: "Rruga Nënë Tereza", postal_code: "50000", country: "Kosovë", latitude: 42.3815, longitude: 20.4320 },
  ],
  "Gjilan": [
    { formatted_address: "Gjilan - Bulevardi i Pavarësisë", city: "Gjilan", street: "Bulevardi i Pavarësisë", postal_code: "60000", country: "Kosovë", latitude: 42.4635, longitude: 21.4678 },
    { formatted_address: "Gjilan - Rruga Adem Jashari", city: "Gjilan", street: "Rruga Adem Jashari", postal_code: "60000", country: "Kosovë", latitude: 42.4650, longitude: 21.4690 },
  ],
  "Mitrovicë": [
    { formatted_address: "Mitrovicë - Sheshi Mehë Uka", city: "Mitrovicë", street: "Sheshi Mehë Uka", postal_code: "40000", country: "Kosovë", latitude: 42.8914, longitude: 20.8660 },
    { formatted_address: "Mitrovicë - Rruga Mbretëresha Teutë", city: "Mitrovicë", street: "Rruga Mbretëresha Teutë", postal_code: "40000", country: "Kosovë", latitude: 42.8930, longitude: 20.8680 },
  ]
};

// Comprehensive Kosovo Places Database for Instant Local Fallback & Offline Autocomplete
export const KOSOVO_LOCATIONS: PlaceDetails[] = [
  ...KOSOVO_CITIES,
  ...Object.values(KOSOVO_STREETS).flat()
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
  selectedCity,
}) => {
  const [query, setQuery] = useState(initialValue);
  const getCityBaseList = () => {
    if (selectedCity && KOSOVO_STREETS[selectedCity]) {
      return KOSOVO_STREETS[selectedCity];
    }
    return KOSOVO_CITIES;
  };

  const [suggestions, setSuggestions] = useState<PlaceDetails[]>(getCityBaseList());
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (selectedCity) {
      setSuggestions(getCityBaseList());
    }
  }, [selectedCity]);

  const handleFocus = () => {
    const baseList = getCityBaseList();
    if (query.trim().length === 0) {
      setSuggestions(baseList);
      setIsOpen(true);
    } else {
      handleTextChange(query);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const cleanInput = normalizeStr(text);
    const baseList = getCityBaseList();

    if (cleanInput.length === 0) {
      setSuggestions(baseList);
      setIsOpen(true);
      return;
    }

    // Filter streets and places specific to selected city if provided
    const localMatches = (selectedCity && KOSOVO_STREETS[selectedCity] ? KOSOVO_STREETS[selectedCity] : KOSOVO_LOCATIONS).filter(item =>
      normalizeStr(item.formatted_address).includes(cleanInput) ||
      normalizeStr(item.city).includes(cleanInput) ||
      normalizeStr(item.street).includes(cleanInput)
    );

    setSuggestions(localMatches.length > 0 ? localMatches : baseList);
    setIsOpen(true);

    // Online Google Places Autocomplete API query
    if (cleanInput.length >= 2) {
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
              if (!combined.some(c => normalizeStr(c.formatted_address) === normalizeStr(gp.formatted_address))) {
                combined.push(gp);
              }
            });
            setSuggestions(combined);
          }
        } catch (err) {
          console.warn("Google Places fetch error:", err);
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
    <View className={`relative z-50 ${containerClassName}`} style={{ zIndex: 9999, elevation: 10 }}>
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
          onFocus={handleFocus}
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
        <View
          className="absolute top-16 left-0 right-0 bg-white rounded-3xl border border-slate-200 p-2 shadow-2xl overflow-hidden"
          style={{ zIndex: 9999, elevation: 20, maxHeight: 260 }}
        >
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always" style={{ maxHeight: 250 }}>
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
