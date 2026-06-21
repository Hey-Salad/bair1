import { View } from 'react-native';
import { Text } from 'heroui-native';
import { CloudOff } from 'lucide-react-native';

import { useThemeColor } from 'heroui-native';
import { timeAgo } from '@/lib/time';

interface StaleBadgeProps {
  cachedAt?: string | null;
}

export function StaleBadge({ cachedAt }: StaleBadgeProps) {
  const [warning] = useThemeColor(['warning']);
  if (!cachedAt) return null;
  return (
    <View
      className="flex-row items-center gap-1.5 self-center rounded-full px-3 py-1"
      style={{ backgroundColor: `${warning}22` }}
    >
      <CloudOff size={13} color={warning} />
      <Text className="text-xs" style={{ color: warning }}>
        Offline · last updated {timeAgo(cachedAt)}
      </Text>
    </View>
  );
}
