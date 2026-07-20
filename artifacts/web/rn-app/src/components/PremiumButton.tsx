import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PremiumButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'glass';
  className?: string;
  textClassName?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  variant = 'primary',
  className,
  textClassName,
  ...props
}) => {
  const variants = {
    primary: 'bg-[#3472ef] shadow-lg shadow-[#3472ef]/40',
    secondary: 'bg-white/10 border border-white/10',
    glass: 'bg-white/5 border border-white/5',
  };

  return (
    <TouchableOpacity
      className={cn(
        "px-8 py-4 rounded-[22px] items-center justify-center active:scale-95 transition-all",
        variants[variant],
        className
      )}
      {...props}
    >
      <Text className={cn("text-white font-black uppercase tracking-widest text-[10px]", textClassName)}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
