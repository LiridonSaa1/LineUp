import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { X, User, Mail, Lock, ShieldCheck, Check, Briefcase, Award } from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { createClient } from '@supabase/supabase-js';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { getShopPlanDetails, ShopPlanDetails } from '../utils/planLimits';

// Secondary client to perform admin/Auth operations using service_role key
const SUPABASE_URL = 'https://cnlhqxegzphtlvtgijuj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGhxeGVnenBodGx2dGdpanVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQxMDY0MCwiZXhwIjoyMDk3OTg2NjQwfQ.V925IRdcMhKmVuYeHhXrmEpskvjEHeU5NL9Or0OyUKo';

const adminAuthClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess: () => void;
  employeeLimit?: number;
  currentStaffCount?: number;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  visible,
  onClose,
  shopId,
  onSuccess,
  employeeLimit = 1,
  currentStaffCount = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<ShopPlanDetails | null>(null);

  useEffect(() => {
    if (visible && shopId) {
      getShopPlanDetails(shopId).then(details => {
        setPlanDetails(details);
      });
    }
  }, [visible, shopId]);

  const handleAddStaff = async () => {
    Keyboard.dismiss();

    // Check active plan rule directly for this barbershop
    const latestPlanDetails = await getShopPlanDetails(shopId);
    setPlanDetails(latestPlanDetails);

    if (!latestPlanDetails.canAddBarber || latestPlanDetails.currentBarberCount >= latestPlanDetails.maxBarbers) {
      Alert.alert(
        "Limit i Arritur",
        `Plani juaj aktiv (${latestPlanDetails.planName}) lejon vetëm ${latestPlanDetails.maxBarbers} berber(ë).\nAktualisht keni ${latestPlanDetails.currentBarberCount} berber(ë). Ju lutem bëni upgrade planin tuaj për të shtuar berberë të tjerë.`
      );
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Gabim', 'Ju lutem plotësoni të gjitha fushat.');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`;
      const cleanEmail = email.toLowerCase().trim();

      console.log('Attempting to create or resolve Auth account for:', cleanEmail);
      let authId = null;

      // 1. Create user using the admin client (bypasses active session issues)
      const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'employee'
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('conflict') || authError.status === 422) {
          // The user is already in Auth! Let's query listUsers to retrieve their UUID
          const { data: listData, error: listErr } = await adminAuthClient.auth.admin.listUsers();
          if (listErr) {
            throw new Error(`Dështoi listimi i përdoruesve: ${listErr.message}`);
          }
          
          const foundUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
          if (foundUser) {
            authId = foundUser.id;
            console.log('Found existing user in Auth list:', authId);
          } else {
            throw new Error(`Gabim gjatë regjistrimit të stafit: ${authError.message}`);
          }
        } else {
          throw new Error(`Gabim gjatë krijimit të llogarisë Auth: ${authError.message}`);
        }
      } else {
        authId = authData.user?.id;
      }

      if (!authId) throw new Error("Dështoi marrja e ID-së nga Supabase Auth.");

      console.log('Auth ID resolved:', authId);

      // Check if this user is already added as a barber in this shop
      const { data: existingBarber } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', authId)
        .maybeSingle();

      if (existingBarber) {
        throw new Error("Ky përdorues është tashmë i regjistruar si staf.");
      }

      console.log('Now creating/updating user account...');

      // 2. Upsert into 'users' table FIRST (using admin client to guarantee write)
      const { error: userError } = await adminAuthClient
        .from('users')
        .upsert({
          id: authId,
          email: cleanEmail,
          name: fullName,
          role: 'employee'
        });

      if (userError) {
          throw new Error(`Gabim gjatë sinkronizimit të përdoruesit: ${userError.message}`);
      }

      console.log('User profile created/updated. Now creating barber profile...');

      // 3. Create entry in 'barbers' table SECOND (using admin client to guarantee write)
      const { error: barberError } = await adminAuthClient
        .from('barbers')
        .insert({
          user_id: authId,
          shop_id: shopId,
          name: fullName
        });

      if (barberError) {
        console.error('Supabase error adding to barbers:', barberError);
        let customMsg = barberError.message;
        if (barberError.code === '23503') customMsg = "Salloni ose ID e dyqanit është e pasaktë.";
        throw new Error(customMsg);
      }

      Alert.alert('Sukses', `Stafi ${fullName} u shtua me sukses.`);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Gabim', error.message || 'Ndodhi një gabim gjatë shtimit të stafit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/40 justify-end"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        <Animated.View
          entering={FadeInUp}
          className="bg-white rounded-t-[48px] p-8 pb-12 shadow-2xl border-t border-slate-50"
        >
          <View className="w-12 h-1.5 bg-slate-100 rounded-full self-center mb-8" />

          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-3xl font-black text-[#161719] tracking-tight">Shto Staf</Text>
              <Text className="text-slate-400 font-bold text-sm mt-1">Zgjero ekipin tënd sot</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center border border-slate-100"
            >
              <X size={24} color="#161719" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {planDetails && (
            <View className={`p-4 rounded-2xl mb-6 flex-row items-center justify-between border ${planDetails.canAddBarber ? 'bg-blue-50/60 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
              <View className="flex-row items-center flex-1">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${planDetails.canAddBarber ? 'bg-[#3473ef]/10' : 'bg-rose-500/10'}`}>
                  <Award size={16} color={planDetails.canAddBarber ? '#3473ef' : '#ef4444'} />
                </View>
                <View className="flex-1">
                  <Text className={`font-black text-xs uppercase tracking-wider ${planDetails.canAddBarber ? 'text-[#3473ef]' : 'text-rose-600'}`}>
                    Plani Aktiv: {planDetails.planName}
                  </Text>
                  <Text className="text-slate-500 font-bold text-[11px] mt-0.5">
                    {planDetails.currentBarberCount} nga {planDetails.maxBarbers} berber(ë) të përdorur
                  </Text>
                </View>
              </View>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="gap-y-6">
              {/* Emri & Mbiemri */}
              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Emri</Text>
                  <View className={`bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'firstName' ? 'border-[#3473ef] bg-white' : 'border-transparent'}`}>
                    <User size={18} color={focusedField === 'firstName' ? '#3473ef' : '#94A3B8'} />
                    <TextInput
                      className="flex-1 ml-3 font-bold text-[#161719]"
                      placeholder="Emri"
                      placeholderTextColor="#CBD5E1"
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mbiemri</Text>
                  <View className={`bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'lastName' ? 'border-[#3473ef] bg-white' : 'border-transparent'}`}>
                    <TextInput
                      className="flex-1 font-bold text-[#161719]"
                      placeholder="Mbiemri"
                      placeholderTextColor="#CBD5E1"
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Profesional</Text>
                <View className={`bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'email' ? 'border-[#3473ef] bg-white' : 'border-transparent'}`}>
                  <Mail size={18} color={focusedField === 'email' ? '#3473ef' : '#94A3B8'} />
                  <TextInput
                    className="flex-1 ml-3 font-bold text-[#161719]"
                    placeholder="email@kompania.com"
                    placeholderTextColor="#CBD5E1"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fjalëkalimi i Llogarisë</Text>
                <View className={`bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'password' ? 'border-[#3473ef] bg-white' : 'border-transparent'}`}>
                  <Lock size={18} color={focusedField === 'password' ? '#3473ef' : '#94A3B8'} />
                  <TextInput
                    className="flex-1 ml-3 font-bold text-[#161719]"
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleAddStaff}
            disabled={loading}
            activeOpacity={0.9}
            className={`mt-10 h-16 rounded-[24px] items-center justify-center shadow-2xl shadow-blue-200 ${loading ? 'bg-slate-200' : 'bg-[#3473ef]'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-black mr-2">Shto në Ekip</Text>
                <Check size={20} color="white" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
