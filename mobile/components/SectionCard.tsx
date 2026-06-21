import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Surface, Text } from 'heroui-native';

interface SectionCardProps {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, right, children, className }: SectionCardProps) {
  return (
    <Surface variant="secondary" className={`gap-3 rounded-2xl p-4 ${className ?? ''}`}>
      {title || right ? (
        <View className="flex-row items-center justify-between">
          {title ? (
            <Text className="text-foreground text-base font-semibold">{title}</Text>
          ) : (
            <View />
          )}
          {right}
        </View>
      ) : null}
      {children}
    </Surface>
  );
}
