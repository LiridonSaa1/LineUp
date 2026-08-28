import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { X, User, Mail, Lock, ShieldCheck, Check, Briefcase, Award, AlertCircle } from 'lucide-react-native';
import { supabase } from "../config/supabase";
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (visible && shopId) {
      getShopPlanDetails(shopId).then(details => {
        setPlanDetails(details);
      });
      setEmailError(null);
    }
  }, [visible, shopId]);

  const handleEmailChange = async (val: string) => {
    setEmail(val);
    const clean = val.toLowerCase().trim();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailError(null);
      return;
    }

    try {
      setCheckingEmail(true);
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', clean)
        .maybeSingle();

      if (existingUser) {
        setEmailError('Ky email është i regjistruar tashmë me një llogari përdoruesi.');
      } else {
        setEmailError(null);
      }
    } catch (e) {
      console.warn('Error checking email:', e);
    } finally {
      setCheckingEmail(false);
    }
  };

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
      let authId: string | null = null;
      console.log('Attempting to create or resolve Auth account for:', cleanEmail);
      // 1. Check if user already exists in 'users' table first
      const { data: dbUserCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUserCheck?.id) {
        authId = dbUserCheck.id;
        console.log('Found existing user in DB:', authId);
      } else {
        // Create user using admin client
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
          console.warn("[AddStaff] Admin Auth create note:", authError.message);
          // Check if user is in DB
          const { data: retryUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (retryUser?.id) {
            authId = retryUser.id;
          } else {
            // Fallback: public signUp
            const { data: signUpData } = await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: { full_name: fullName, role: 'employee' }
              }
            });

            if (signUpData?.user?.id) {
              authId = signUpData.user.id;
            } else {
              throw new Error("Përdoruesi me këtë email ekziston ose fjalëkalimi është tepër i shkurtër.");
            }
          }
        } else {
          authId = authData?.user?.id || null;
        }
      }

      if (!authId) throw new Error("Dështoi marrja e ID-së së përdoruesit.");

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

      console.log('User profile created/updated. Now creating barber profile for shop:', shopId);

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
        if (barberError.code === '23503') customMsg = "Salloni nuk u gjet. Ju lutem rifilloni aplikacionin.";
        if (barberError.code === '23505') customMsg = "Ky përdorues është tashmë i regjistruar në sistem.";
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
      console.error('[AddStaff] Catch Block:', error);

      let finalMessage = 'Ndodhi një gabim gjatë shtimit të stafit.';

      if (typeof error === 'string') {
        finalMessage = error;
      } else if (error.message) {
        finalMessage = error.message;
      } else if (typeof error === 'object') {
        // If it's a raw Postgres/Supabase object, try to extract the detail
        finalMessage = error.error_description || error.error || JSON.stringify(error);
      }

      Alert.alert('Gabim', finalMessage);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/40 justify-end"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                <View className={`bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border ${emailError ? 'border-rose-400 bg-rose-50/20' : focusedField === 'email' ? 'border-[#3473ef] bg-white' : 'border-transparent'}`}>
                  <Mail size={18} color={emailError ? '#EF4444' : focusedField === 'email' ? '#3473ef' : '#94A3B8'} />
                  <TextInput
                    className="flex-1 ml-3 font-bold text-[#161719]"
                    placeholder="email@kompania.com"
                    placeholderTextColor="#CBD5E1"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {checkingEmail && <ActivityIndicator size="small" color="#3473ef" />}
                </View>
                {emailError && (
                  <Animated.View entering={FadeIn} className="mt-2 ml-1 flex-row items-center">
                    <AlertCircle size={14} color="#EF4444" />
                    <Text className="text-rose-500 font-bold text-xs ml-1.5">{emailError}</Text>
                  </Animated.View>
                )}
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
            disabled={loading || checkingEmail || !!emailError || !firstName || !lastName || !email || !password}
            activeOpacity={0.9}
            className={`mt-10 h-16 rounded-[24px] items-center justify-center shadow-2xl ${(loading || checkingEmail || !!emailError || !firstName || !lastName || !email || !password) ? 'bg-slate-300 opacity-60' : 'bg-[#3473ef] shadow-blue-200'}`}
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
