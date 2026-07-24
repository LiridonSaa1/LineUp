const fs = require('fs');
const path = 'src/screens/SearchScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Also need to add ChevronDown and ChevronUp to imports if not there.
if (!content.includes('ChevronDown')) {
  content = content.replace('import { Search, MapPin', 'import { Search, MapPin, ChevronDown, ChevronUp');
}

const target = `{/* --- TREATMENT PANEL --- */}
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
                className={\`px-6 py-2.5 rounded-full mr-2 border \${activeFilterTab === p ? 'bg-black border-black' : 'bg-white border-slate-200'}\`}
              >
                <Text className={\`font-bold \${activeFilterTab === p ? 'text-white' : 'text-[#161719]'}\`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredTreatments.length > 0 && (
            <>
              <Text className="text-xl font-bold mb-4">Trajtimet</Text>
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
      </Animated.View>`;

const replacement = `{/* --- TREATMENT PANEL --- */}
      <Animated.View style={[treatmentStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }]}>
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => setActivePanel('main')} className="mr-4"><ArrowLeft size={24} color="black" /></TouchableOpacity>
            <Text className="text-xl font-bold text-[#161719]">Zgjidh Shërbimet</Text>
          </View>
          {selectedSubIds.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedSubIds([])}>
              <Text className="text-[#3473ef] font-bold">Pastro</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
          {dbCategories.map((cat) => {
            const isExpanded = expandedCategories.includes(cat.id);
            const catSubIds = dbSubcategories.filter(s => s.category_id === cat.id).map(s => s.id);
            const selectedCount = catSubIds.filter(id => selectedSubIds.includes(id)).length;
            const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;

            return (
              <View key={cat.id} className="mb-4 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                <TouchableOpacity
                  onPress={() => {
                    setExpandedCategories(prev =>
                      prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
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
                      }}
                      className="flex-row items-center py-3 border-b border-slate-50"
                    >
                      <Text className={\`font-black text-sm flex-1 \${catSubIds.every(id => selectedSubIds.includes(id)) ? 'text-[#3473ef]' : 'text-[#64748b]'}\`}>Të gjitha në këtë kategori</Text>
                    </TouchableOpacity>

                    {dbSubcategories.filter(s => s.category_id === cat.id).map(sub => {
                      const isSelected = selectedSubIds.includes(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => {
                            setSelectedSubIds(prev =>
                              prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                            );
                          }}
                          className="flex-row items-center py-3 border-b border-slate-50"
                        >
                          <View className={\`w-5 h-5 rounded border items-center justify-center mr-3 \${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}\`}>
                            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                          </View>
                          <Text className={\`text-[14px] flex-1 \${isSelected ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}\`}>{sub.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Sticky Bottom Button for Treatment Panel */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
          <TouchableOpacity
            onPress={() => {
              setActivePanel('main');
              let queryText = "";
              if (selectedSubIds.length > 0) {
                const selectedNames = dbSubcategories
                  .filter(s => selectedSubIds.includes(s.id))
                  .map(s => s.name);
                queryText = selectedNames.join(", ");
              }
              setSelectedTreatment(queryText);
            }}
            className="h-14 bg-black rounded-2xl items-center justify-center shadow-lg"
          >
            <Text className="text-white font-black text-lg">
              Në rregull {selectedSubIds.length > 0 ? \`(\${selectedSubIds.length})\` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log('Fixed TREATMENT PANEL!');
