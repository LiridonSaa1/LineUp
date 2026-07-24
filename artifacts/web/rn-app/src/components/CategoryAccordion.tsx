import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

interface CategoryAccordionProps {
  categories: Category[];
  subcategories: Subcategory[];
  selectedSubcategories: string[];
  onToggleSubcategory: (subId: string) => void;
}

export const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  categories,
  subcategories,
  selectedSubcategories,
  onToggleSubcategory,
}) => {
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const toggleCategory = (catId: string) => {
    if (expandedCats.includes(catId)) {
      setExpandedCats(expandedCats.filter(id => id !== catId));
    } else {
      setExpandedCats([...expandedCats, catId]);
    }
  };

  return (
    <View className="gap-y-4 mt-2">
      {categories.map((cat) => {
        const isExpanded = expandedCats.includes(cat.id);
        const catSubs = subcategories.filter(s => s.category_id === cat.id);
        const selectedCount = catSubs.filter(s => selectedSubcategories.includes(s.id)).length;

        return (
          <View key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleCategory(cat.id)}
              className="flex-row items-center justify-between p-4 bg-white"
            >
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">{cat.icon}</Text>
                <Text className="text-[15px] font-bold text-[#161719]">{cat.name}</Text>
                {selectedCount > 0 && (
                  <View className="ml-3 bg-[#3473ef] px-2 py-0.5 rounded-full">
                    <Text className="text-white text-xs font-bold">{selectedCount}</Text>
                  </View>
                )}
              </View>
              {isExpanded ? (
                <ChevronUp size={20} color="#8789A3" />
              ) : (
                <ChevronDown size={20} color="#8789A3" />
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View className="bg-slate-50 border-t border-slate-100 px-4 py-2">
                {catSubs.map((sub) => {
                  const isSelected = selectedSubcategories.includes(sub.id);
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      activeOpacity={0.7}
                      onPress={() => onToggleSubcategory(sub.id)}
                      className="flex-row items-center py-3 border-b border-slate-100 last:border-0"
                    >
                      <View className={`w-6 h-6 rounded-md border items-center justify-center mr-3 ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}`}>
                        {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                      </View>
                      <Text className={`text-[15px] ${isSelected ? 'font-bold text-[#161719]' : 'font-medium text-[#64748b]'}`}>
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
