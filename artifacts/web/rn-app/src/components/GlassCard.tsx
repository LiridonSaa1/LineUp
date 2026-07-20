import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = 20,
  tint = 'dark',
  children,
  className,
  ...props
}) => {
  return (
    <View
      className={cn("rounded-[32px] overflow-hidden border border-white/10 shadow-2xl", className)}
      {...props}
    >
      <BlurView intensity={intensity} tint={tint} className="p-4">
        {children}
      </BlurView>
    </View>
  );
};
