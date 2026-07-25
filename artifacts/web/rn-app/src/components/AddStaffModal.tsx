import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, User, Mail, Lock, ShieldCheck, Check, Briefcase } from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { createClient } from '@supabase/supabase-js';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

// Secondary client to perform signUp without persisting session (keeps owner logged in)
const SUPABASE_URL = 'https://cnlhqxegzphtlvtgijuj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGhxeGVnenBodGx2dGdpanVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTA2NDAsImV4cCI6MjA5Nzk4NjY0MH0.AiT2pha9udGDx7og-e7f9XJyHZUJJClIEj43YEyy-Pc';

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ visible, onClose, shopId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleAddStaff = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Gabim', 'Ju lutem plotësoni të gjitha fushat.');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`;
      const cleanEmail = email.toLowerCase().trim();

      console.log('Attempting to create real Auth account for:', cleanEmail);

      // 1. Create real Supabase Auth account using the secondary client
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'employee'
          }
        }
      });

      if (authError) {
        throw new Error(`Gabim gjatë krijimit të llogarisë Auth: ${authError.message}`);
      }

      const authId = authData.user?.id;
      if (!authId) throw new Error("Dështoi marrja e ID-së nga Supabase Auth.");

      console.log('Auth account created successfully. ID:', authId);

      // 2. Create entry in 'barbers' table FIRST
      const { error: barberError } = await supabase
        .from('barbers')
        .insert({
          id: authId, // Use the same Auth ID for the barber profile
          shop_id: shopId,
          name: fullName
        });

      if (barberError) {
        console.error('Supabase error adding to barbers:', barberError);
        let customMsg = barberError.message;
        if (barberError.code === '23503') customMsg = "ID e dyqanit është e pasaktë.";
        throw new Error(customMsg);
      }

      console.log('Barber profile created. Now creating user account...');

      // 3. Upsert into 'users' table SECOND
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authId,
          email: cleanEmail,
          name: fullName,
          role: 'employee'
        }, { onConflict: 'email' });

      if (userError) {
          throw new Error(`Gabim gjatë sinkronizimit të përdoruesit: ${userError.message}`);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          <View className="flex-row justify-between items-center mb-8">
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

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
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
