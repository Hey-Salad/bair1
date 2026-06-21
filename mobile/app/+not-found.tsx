import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'heroui-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="bg-background flex-1 items-center justify-center gap-3 p-6">
        <Text className="text-foreground text-lg font-semibold">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/">
          <Text className="text-bair-green font-semibold">Go to home</Text>
        </Link>
      </View>
    </>
  );
}
