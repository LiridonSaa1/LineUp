const fs = require('fs');
let c = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');

const oldStr = 'const renderShopCard = (item: any) => (';
const newStr = `  const renderRecommendedCard = (shop: any, index: number) => (
    <TouchableOpacity
      key={shop.id || index}
      onPress={() => onSelectShop(shop)}
      activeOpacity={0.95}
      className="mr-4 bg-white rounded-[28px] overflow-hidden shadow-md border border-[#FFD700]/30"
      style={{ width: (width - 48) * 0.7, height: 260 }}
    >
      <View className="relative w-full h-36">
        <Image
          source={{ uri: shop.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20" />
        <View className="absolute top-3 left-3 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center border border-white/20 backdrop-blur-md">
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text className="text-white font-black text-xs ml-1.5">{shop.rating || '5.0'}</Text>
        </View>
        <View className="absolute bottom-[-16] right-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-50">
          <Image source={{ uri: shop.logo_url || 'https://ui-avatars.com/api/?name=' + shop.name }} className="w-10 h-10 rounded-full" />
        </View>
      </View>

      <View className="p-4 pt-5 flex-1 justify-between">
        <View>
          <Text className="text-xl font-black text-[#161719] mb-1" numberOfLines={1}>{shop.name}</Text>
          <View className="flex-row items-center">
            <MapPin size={12} color="#8789A3" />
            <Text className="text-[#8789A3] font-bold text-xs ml-1" numberOfLines={1}>{shop.address || shop.city}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <Text className="text-[#3473ef] font-black text-sm uppercase tracking-wider">Top Rated</Text>
          <View className="w-8 h-8 rounded-full bg-[#3473ef]/10 items-center justify-center">
            <ArrowUpRight size={16} color="#3473ef" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderShopCard = (item: any) => (`;

if (!c.includes('renderRecommendedCard')) {
  c = c.replace(oldStr, newStr);
}

// Fix map args and the conditional render of the title for new shops
c = c.replace('{newShops.map((shop, i) => renderShopCard(shop, i))}', '{newShops.map(renderShopCard)}');

const oldNewSection = `      {/* ── NEW TO LINEUP SECTION ───────────────────── */}
      <View className="mt-4 px-6 mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-[#161719]">Të reja në LineUp</Text>
        </View>
        <View className="overflow-hidden">
          <ScrollView
            ref={newToLineUpScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={(width - 48) * 0.63 + 16}
            decelerationRate="fast"
          >
            {newShops.map(renderShopCard)}
          </ScrollView>
        </View>
      </View>`;

const newNewSection = `      {/* ── NEW TO LINEUP SECTION ───────────────────── */}
      {newShops.length > 0 && (
        <View className="mt-4 px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-[#161719]">Të reja në LineUp</Text>
          </View>
          <View className="overflow-hidden">
            <ScrollView
              ref={newToLineUpScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={(width - 48) * 0.63 + 16}
              decelerationRate="fast"
            >
              {newShops.map(renderShopCard)}
            </ScrollView>
          </View>
        </View>
      )}`;

// Since the oldNewSection string matching can be flaky with whitespace, I'll just regex replace it
c = c.replace(/\{\/\*\s*── NEW TO LINEUP SECTION[^]+?<\/ScrollView>\s*<\/View>\s*<\/View>/g, newNewSection);

// Fix the fallback for newShops logic so it doesn't show old shops
c = c.replace(`        if (newData && newData.length > 0) {
          setNewShops(newData);
        } else if (shopsData) {
          // Fallback if no new shops found
          setNewShops(shopsData.slice().reverse());
        }`, 
        `        if (newData && newData.length > 0) {
          setNewShops(newData);
        } else {
          setNewShops([]);
        }`);

fs.writeFileSync('src/screens/HomeScreen.tsx', c);
console.log('HomeScreen completely fixed!');
