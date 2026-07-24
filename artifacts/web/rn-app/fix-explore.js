const fs = require('fs');
const path = 'src/screens/ExploreScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add initialSubIds to ExploreScreenProps
if (!content.includes('initialSubIds?: string[];')) {
  content = content.replace(
    'initialCoords?: { lat?: number; lng?: number };',
    'initialCoords?: { lat?: number; lng?: number };\n  initialSubIds?: string[];'
  );
}

// 2. Add it to component parameters
content = content.replace(
  'initialSearch = "",\n  initialCoords\n}) => {',
  'initialSearch = "",\n  initialCoords,\n  initialSubIds = []\n}) => {'
);

// 3. Add map zoom logic when a shop is clicked
// We will replace onSelectShop(shop) with logic to zoom AND open the sheet if we want,
// but ExploreScreen already has onSelectShop which opens BarberDetailScreen (in App.tsx).
// The user requested: "klikoni njeren ta ben zoom ne map tek addressa e ti dhe ta shfaq buttonin rezervo termin"
// In ExploreScreen, clicking a marker or list item should zoom to it and show a bottom sheet with "Rezervo Termin" INSTEAD of immediately navigating to DetailScreen.

// Currently, tapping a marker does onSelectShop(shop), which in App.tsx sets selectedShop and renders BarberDetailScreen.
// I will change the Map Marker onPress to just focus the map and set a local selected shop.
// Then the bottom sheet will show the selected shop details and a "Rezervo termin" button that actually calls onSelectShop.

const selectedShopState = `  const [selectedShopMarker, setSelectedShopMarker] = useState<any>(null);`;
if (!content.includes('selectedShopMarker')) {
  content = content.replace(
    'const [isExpanded, setIsExpanded] = useState(false);',
    'const [isExpanded, setIsExpanded] = useState(false);\n' + selectedShopState
  );
}

const mapZoomLogic = `
  const handleMarkerPress = (shop: any) => {
    setSelectedShopMarker(shop);
    if (shop.latitude && shop.longitude) {
      mapRef.current?.animateToRegion({
        latitude: shop.latitude,
        longitude: shop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };
`;
if (!content.includes('handleMarkerPress')) {
  content = content.replace(
    'const handleScroll = (event: any) => {',
    mapZoomLogic + '\n  const handleScroll = (event: any) => {'
  );
}

// Replace Marker onPress
content = content.replace(
  /onPress=\{\(\) => onSelectShop\(shop\)\}/g,
  'onPress={() => handleMarkerPress(shop)}'
);

// Replace list item onPress
content = content.replace(
  /onPress=\{\(\) => onSelectShop\(shop\)\}/g,
  'onPress={() => handleMarkerPress(shop)}'
);

// Add "Rezervo termin" bottom card if a shop is selected
const rezervoCard = `
      {selectedShopMarker && (
        <View className="absolute bottom-6 left-6 right-6 bg-white rounded-3xl p-4 shadow-2xl flex-row items-center border border-slate-100">
          <Image source={{ uri: selectedShopMarker.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800' }} className="w-16 h-16 rounded-2xl mr-4" />
          <View className="flex-1">
            <Text className="font-black text-[#161719] text-lg">{selectedShopMarker.name}</Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#8789A3" />
              <Text className="text-[#8789A3] text-xs font-bold ml-1">{selectedShopMarker.city}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onSelectShop(selectedShopMarker)}
            className="bg-[#3473ef] px-4 py-3 rounded-xl shadow-lg shadow-[#3473ef]/30"
          >
            <Text className="text-white font-black">Rezervo</Text>
          </TouchableOpacity>
        </View>
      )}
`;

if (!content.includes('selectedShopMarker && (')) {
  content = content.replace(
    /<\/View>\n\s*$/g,
    rezervoCard + '\n    </View>\n'
  );
}

fs.writeFileSync(path, content);
console.log('ExploreScreen updated for map zoom and Rezervo button!');
