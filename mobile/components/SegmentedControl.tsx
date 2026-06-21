import { Pressable, View } from 'react-native';
import { Text } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface SegmentedControlProps<T extends string> {
  options: readonly { label: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="bg-surface border-border flex-row rounded-full border p-1">
      {options.map((opt) => {
        const active = opt.label === value;
        return (
          <Pressable
            key={opt.label}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
              onChange(opt.label);
            }}
            className={`flex-1 items-center rounded-full px-2 py-1.5 ${active ? 'bg-accent' : ''}`}
          >
            <Text
              className={`text-xs font-semibold ${active ? 'text-accent-foreground' : 'text-muted'}`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
