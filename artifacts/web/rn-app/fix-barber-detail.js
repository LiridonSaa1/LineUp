const fs = require('fs');
const path = 'src/screens/BarberDetailScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Modal and useState to imports
if (!content.includes('Modal')) {
  content = content.replace(
    'import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";',
    'import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal, TextInput } from "react-native";\nimport { useState } from "react";'
  );
}

// 2. Add lucide icons Check, X, User, Clock, Scissors
if (!content.includes('Check, X')) {
  content = content.replace(
    'import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar } from "lucide-react-native";',
    'import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar, Check, X, User as UserIcon, Clock, Scissors as ScissorsIcon } from "lucide-react-native";'
  );
}

// 3. Add states
const statesToAdd = `  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("Sot, 22 Qershor");
  const [selectedTime, setSelectedTime] = useState<string>("14:30");
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const MOCK_EMPLOYEES = [
    { id: 1, name: "Arben B.", role: "Senior Barber", rating: "4.9" },
    { id: 2, name: "Luan M.", role: "Master Barber", rating: "5.0" }
  ];
  const MOCK_SERVICES = [
    { id: 1, name: "Haircut", price: 15, duration: "30 min" },
    { id: 2, name: "Beard Trim", price: 10, duration: "15 min" },
    { id: 3, name: "Hair & Beard", price: 22, duration: "45 min" }
  ];
`;

if (!content.includes('showBookingModal')) {
  content = content.replace(
    '  const shopName = shop?.name || "Classic Cuts Barber Shop";',
    statesToAdd + '\n  const shopName = shop?.name || "Classic Cuts Barber Shop";'
  );
}

// 4. Update the "Book Appointment" button
content = content.replace(
  '<TouchableOpacity className="bg-[#3473ef] py-4 rounded-full items-center justify-center shadow-lg shadow-[#3473ef]/30 active:scale-98">',
  '<TouchableOpacity onPress={() => setShowBookingModal(true)} className="bg-[#3473ef] py-4 rounded-full items-center justify-center shadow-lg shadow-[#3473ef]/30 active:scale-98">'
);

// 5. Add the Modals
const modalsCode = `
      {/* Booking Modal Flow */}
      <Modal visible={showBookingModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] h-[85%] overflow-hidden">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
              {bookingStep > 1 ? (
                <TouchableOpacity onPress={() => setBookingStep(bookingStep - 1)}>
                  <ArrowLeft size={24} color="#161719" />
                </TouchableOpacity>
              ) : (
                <View className="w-6" />
              )}
              <Text className="text-xl font-black text-[#161719]">
                {bookingStep === 1 ? 'Zgjidh Stafin' : bookingStep === 2 ? 'Zgjidh Shërbimet' : bookingStep === 3 ? 'Koha & Data' : 'Konfirmimi'}
              </Text>
              <TouchableOpacity onPress={() => { setShowBookingModal(false); setBookingStep(1); }}>
                <X size={24} color="#161719" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-4">
              {/* STEP 1: Staff */}
              {bookingStep === 1 && (
                <View>
                  <Text className="text-sm font-bold text-[#8789A3] mb-4">Me cilin dëshironi të rezervoni?</Text>
                  {MOCK_EMPLOYEES.map(emp => (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => setSelectedEmployee(emp)}
                      className={\`flex-row items-center p-4 rounded-2xl mb-4 border \${selectedEmployee?.id === emp.id ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-slate-50'}\`}
                    >
                      <View className="w-12 h-12 rounded-full bg-slate-200 items-center justify-center mr-4">
                        <UserIcon size={20} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-black text-[#161719]">{emp.name}</Text>
                        <Text className="text-xs font-bold text-[#8789A3]">{emp.role}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Star size={14} color="#FFC107" fill="#FFC107" />
                        <Text className="text-sm font-black text-[#161719] ml-1">{emp.rating}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    onPress={() => setSelectedEmployee({ id: 0, name: 'Çdokush (Koha e Parë e Lirë)' })}
                    className={\`flex-row items-center p-4 rounded-2xl mb-4 border \${selectedEmployee?.id === 0 ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-slate-50'}\`}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-black text-[#161719]">Koha e parë e lirë</Text>
                      <Text className="text-xs font-bold text-[#8789A3]">Kushdo nga stafi</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: Services */}
              {bookingStep === 2 && (
                <View>
                  <Text className="text-sm font-bold text-[#8789A3] mb-4">Shërbimet nga {selectedEmployee?.name}</Text>
                  {MOCK_SERVICES.map(srv => {
                    const isSelected = selectedServices.find(s => s.id === srv.id);
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        onPress={() => {
                          setSelectedServices(prev => 
                            isSelected ? prev.filter(s => s.id !== srv.id) : [...prev, srv]
                          );
                        }}
                        className={\`flex-row items-center justify-between p-4 rounded-2xl mb-4 border \${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-slate-50'}\`}
                      >
                        <View className="flex-1">
                          <Text className="text-base font-black text-[#161719]">{srv.name}</Text>
                          <Text className="text-xs font-bold text-[#8789A3]">{srv.duration}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-lg font-black text-[#3473ef] mr-4">{srv.price}€</Text>
                          <View className={\`w-6 h-6 rounded-md border items-center justify-center \${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}\`}>
                            {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* STEP 3: Date & Time */}
              {bookingStep === 3 && (
                <View>
                  <Text className="text-sm font-bold text-[#8789A3] mb-4">Zgjidhni datën dhe orën për takimin</Text>
                  {/* Mock calendar row */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {['22 Qershor', '23 Qershor', '24 Qershor', '25 Qershor'].map(date => (
                      <TouchableOpacity
                        key={date}
                        onPress={() => setSelectedDate(date)}
                        className={\`px-6 py-3 rounded-xl mr-3 border \${selectedDate === date ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}\`}
                      >
                        <Text className={\`font-black \${selectedDate === date ? 'text-white' : 'text-[#161719]'}\`}>{date}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text className="text-sm font-bold text-[#161719] mb-4">Orët e lira</Text>
                  <View className="flex-row flex-wrap gap-3">
                    {['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'].map(time => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        className={\`w-[30%] py-3 rounded-xl border items-center justify-center \${selectedTime === time ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-slate-50 border-slate-200'}\`}
                      >
                        <Text className={\`font-black \${selectedTime === time ? 'text-white' : 'text-[#161719]'}\`}>{time}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* STEP 4: Summary / Coupon */}
              {bookingStep === 4 && (
                <View>
                  <View className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-6">
                    <Text className="text-center text-[#8789A3] font-bold text-xs uppercase tracking-widest mb-4">Përmbledhja e Rezervimit</Text>
                    
                    <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-200">
                      <Text className="font-bold text-[#161719]">Lokacioni</Text>
                      <Text className="font-black text-[#161719]">{shopName}</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-200">
                      <Text className="font-bold text-[#161719]">Stafi</Text>
                      <Text className="font-black text-[#161719]">{selectedEmployee?.name}</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-200">
                      <Text className="font-bold text-[#161719]">Koha</Text>
                      <Text className="font-black text-[#161719]">{selectedDate}, {selectedTime}</Text>
                    </View>
                    
                    <View className="mb-4 pb-4 border-b border-slate-200">
                      <Text className="font-bold text-[#161719] mb-2">Shërbimet</Text>
                      {selectedServices.map(s => (
                        <View key={s.id} className="flex-row justify-between mb-1">
                          <Text className="text-[#8789A3] font-bold">{s.name}</Text>
                          <Text className="font-black text-[#161719]">{s.price}€</Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="font-black text-lg text-[#161719]">Totali</Text>
                      <Text className="font-black text-2xl text-[#3473ef]">
                        {selectedServices.reduce((acc, curr) => acc + curr.price, 0)}€
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity className="flex-row items-center justify-center mb-8">
                    <MapPin size={16} color="#3473ef" />
                    <Text className="text-[#3473ef] font-bold ml-1 text-sm underline">Shiko në Google Maps</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="h-32" />
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
              <TouchableOpacity
                onPress={() => {
                  if (bookingStep < 4) {
                    if (bookingStep === 1 && !selectedEmployee) return;
                    if (bookingStep === 2 && selectedServices.length === 0) return;
                    if (bookingStep === 3 && (!selectedDate || !selectedTime)) return;
                    setBookingStep(bookingStep + 1);
                  } else {
                    // Confirm Booking -> Trigger Auth Flow
                    setShowBookingModal(false);
                    setShowAuthModal(true);
                  }
                }}
                className={\`h-14 rounded-full items-center justify-center shadow-lg \${
                  (bookingStep === 1 && !selectedEmployee) || 
                  (bookingStep === 2 && selectedServices.length === 0)
                    ? 'bg-slate-300' : 'bg-[#3473ef]'
                }\`}
              >
                <Text className="text-white font-black text-lg">
                  {bookingStep === 4 ? 'Konfirmo Rezervimin' : 'Vazhdo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auth / OTP Modal Flow */}
      <Modal visible={showAuthModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white w-full rounded-[32px] overflow-hidden">
            <View className="p-6 items-center">
              <View className="w-16 h-16 bg-[#3473ef]/10 rounded-full items-center justify-center mb-4">
                <UserIcon size={28} color="#3473ef" />
              </View>
              <Text className="text-2xl font-black text-[#161719] mb-2 text-center">Identifikohu</Text>
              <Text className="text-[#8789A3] text-center font-bold mb-6">Për të konfirmuar rezervimin, ju lutem shënoni të dhënat tuaja.</Text>
              
              <View className="w-full gap-4">
                <TextInput placeholder="Emri dhe Mbiemri" className="h-14 bg-slate-50 rounded-xl px-4 border border-slate-100 font-bold" />
                <TextInput placeholder="Numri i telefonit (+383...)" keyboardType="phone-pad" className="h-14 bg-slate-50 rounded-xl px-4 border border-slate-100 font-bold" />
                
                <TouchableOpacity 
                  onPress={() => {
                    setShowAuthModal(false);
                    alert("Rezervimi juaj u pranua me sukses! Detajet u dërguan në email (përmes Brevo) dhe telefon (përmes Twilio).");
                  }}
                  className="bg-black h-14 rounded-xl items-center justify-center mt-2"
                >
                  <Text className="text-white font-black text-lg">Prano Kodin SMS (OTP)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
`;

if (!content.includes('Booking Modal Flow')) {
  content = content.replace(
    /<\/View>\n\s*$/g,
    modalsCode + '\n    </View>\n'
  );
}

fs.writeFileSync(path, content);
console.log('BarberDetailScreen updated with Booking and OTP flow!');
