import { BarChart3, Bot, Home, Map as MapIcon, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';

export default function TabLayout() {
  const [background, foreground, border, accent, muted, surface] = useThemeColor([
    'background',
    'foreground',
    'border',
    'accent',
    'muted',
    'surface',
  ]);

  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar style is a string enum, not a ViewStyle */}
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          headerTitleStyle: { color: foreground, fontWeight: '700' },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: background },
          animation: 'shift',
          tabBarStyle: {
            backgroundColor: surface,
            borderTopColor: border,
          },
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Assistant',
            tabBarIcon: ({ color, size }) => <Bot color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
