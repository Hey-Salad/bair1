import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Switch, View } from 'react-native';
import { Button, Input, Spinner, Text } from 'heroui-native';
import { useThemeColor } from 'heroui-native';
import { Bell, LogIn, LogOut, Plus, ShoppingBag, ShieldCheck, UserPlus } from 'lucide-react-native';

import { SectionCard } from '@/components/SectionCard';
import { aqiColor } from '@/lib/aqi';
import { createUser, provisionDevice } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { HARDWARE_STORE_URL } from '@/lib/config';
import { useDevices } from '@/lib/hooks';
import {
  registerForPushNotifications,
  scheduleMorningBriefing,
  syncPushToken,
} from '@/lib/notifications';
import { timeAgo } from '@/lib/time';
import type { Role } from '@/lib/types';

function roleRank(role: Role | undefined): number {
  if (role === 'super_admin') return 3;
  if (role === 'admin') return 2;
  if (role === 'user') return 1;
  return 0;
}

export default function ProfileScreen() {
  const { me, token, configured, loading, error, login, logout, restore } = useAuthStore();
  const { devices } = useDevices();
  const [accent] = useThemeColor(['accent']);
  const [alertsOn, setAlertsOn] = useState(false);

  useEffect(() => {
    void restore();
  }, [restore]);

  const isAdmin = roleRank(me?.role) >= 2;
  const myDevices = me?.devices && me.devices.length > 0 ? me.devices : devices;

  const toggleAlerts = async (value: boolean) => {
    setAlertsOn(value);
    if (!value) return;
    const pushToken = await registerForPushNotifications();
    await scheduleMorningBriefing();
    if (pushToken && token && myDevices[0]) {
      try {
        await syncPushToken(token, myDevices[0].deviceId, pushToken);
      } catch {
        // backend alert endpoint not live yet — token sync is best-effort
      }
    }
  };

  return (
    <ScrollView
      className="bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
    >
      {/* Profile / auth card */}
      <SectionCard>
        {me ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="bg-accent h-12 w-12 items-center justify-center rounded-full">
                <Text className="text-lg font-bold text-[#191C18]">
                  {me.name?.[0]?.toUpperCase() ?? me.email[0]?.toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-base font-semibold">
                  {me.name || me.email}
                </Text>
                <Text className="text-muted text-xs">{me.email}</Text>
              </View>
              <View className="bg-accent/15 flex-row items-center gap-1 rounded-full px-2.5 py-1">
                <ShieldCheck size={12} color="#6EAA3C" />
                <Text className="text-bair-green text-xs font-semibold">{me.role}</Text>
              </View>
            </View>
            <Button variant="outline" onPress={() => void logout()}>
              <LogOut size={16} color="#EFF0ED" />
              <Button.Label>Log out</Button.Label>
            </Button>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-foreground text-base font-semibold">Sign in</Text>
            <Text className="text-muted text-sm">
              {configured
                ? 'Log in with Auth0 to manage your devices and admin tools.'
                : 'Auth0 is not configured yet. Add EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID to enable login. Public air-quality data works without an account.'}
            </Text>
            {error ? <Text className="text-danger text-xs">{error}</Text> : null}
            <Button isDisabled={!configured || loading} onPress={() => void login()}>
              {loading ? (
                <Spinner size="sm" color="#191C18" />
              ) : (
                <LogIn size={16} color="#191C18" />
              )}
              <Button.Label>
                {configured ? 'Continue with Auth0' : 'Auth0 not configured'}
              </Button.Label>
            </Button>
          </View>
        )}
      </SectionCard>

      {/* Your devices */}
      <SectionCard title="Your devices">
        {myDevices.length === 0 ? (
          <Text className="text-muted text-sm">No devices yet.</Text>
        ) : (
          myDevices.map((d) => (
            <View key={d.deviceId} className="flex-row items-center gap-3 py-1.5">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: aqiColor(d.latestReading?.aqi ?? 0) }}
              />
              <View className="flex-1">
                <Text className="text-foreground text-sm font-medium">{d.name}</Text>
                <Text className="text-muted text-xs">
                  {d.status} ·{' '}
                  {d.latestReading
                    ? `updated ${timeAgo(d.latestReading.timestamp)}`
                    : 'no readings'}
                </Text>
              </View>
              <Text className="text-muted text-xs">{Math.round(d.latestReading?.aqi ?? 0)}</Text>
            </View>
          ))
        )}
      </SectionCard>

      {/* Notifications (stretch) */}
      <SectionCard title="Alerts">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2">
              <Bell size={16} color="#6EAA3C" />
              <Text className="text-foreground text-sm font-medium">AQI & morning briefing</Text>
            </View>
            <Text className="text-muted mt-1 text-xs">
              Threshold alerts (100, 150, 200) and an 8am daily briefing.
            </Text>
          </View>
          <Switch
            value={alertsOn}
            onValueChange={(v) => void toggleAlerts(v)}
            trackColor={{ true: accent }}
          />
        </View>
      </SectionCard>

      {/* Admin tools — only for admin/super_admin */}
      {isAdmin && token ? <AdminTools token={token} canManageUsers /> : null}

      {/* Hardware store link */}
      <Button variant="secondary" onPress={() => void Linking.openURL(HARDWARE_STORE_URL)}>
        <ShoppingBag size={16} color="#EFF0ED" />
        <Button.Label>Buy a Bair1 sensor</Button.Label>
      </Button>

      <Text className="text-muted text-center text-xs">Built by Bilt.me</Text>
    </ScrollView>
  );
}

function notify(msg: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    globalThis.alert?.(msg);
  } else {
    Alert.alert('Bair1', msg);
  }
}

function AdminTools({ token, canManageUsers }: { token: string; canManageUsers: boolean }) {
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userBusy, setUserBusy] = useState(false);

  const onProvision = async () => {
    if (!deviceId.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await provisionDevice(token, {
        deviceId: deviceId.trim(),
        name: name.trim(),
        location: location.trim(),
      });
      notify('Device provisioned.');
      setDeviceId('');
      setName('');
      setLocation('');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not provision device.');
    } finally {
      setBusy(false);
    }
  };

  const onCreateUser = async () => {
    if (!userEmail.trim() || !userName.trim()) return;
    setUserBusy(true);
    try {
      await createUser(token, { email: userEmail.trim(), name: userName.trim(), role: 'user' });
      notify('User created.');
      setUserEmail('');
      setUserName('');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not create user.');
    } finally {
      setUserBusy(false);
    }
  };

  return (
    <>
      <SectionCard title="Provision device">
        <Input
          placeholder="Device ID"
          value={deviceId}
          onChangeText={setDeviceId}
          autoCapitalize="characters"
        />
        <Input placeholder="Name" value={name} onChangeText={setName} />
        <Input placeholder="Location" value={location} onChangeText={setLocation} />
        <Button isDisabled={busy} onPress={() => void onProvision()}>
          {busy ? <Spinner size="sm" color="#191C18" /> : <Plus size={16} color="#191C18" />}
          <Button.Label>Add device</Button.Label>
        </Button>
      </SectionCard>

      {canManageUsers ? (
        <SectionCard title="Create user">
          <Input
            placeholder="Email"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input placeholder="Name" value={userName} onChangeText={setUserName} />
          <Button isDisabled={userBusy} onPress={() => void onCreateUser()}>
            {userBusy ? (
              <Spinner size="sm" color="#191C18" />
            ) : (
              <UserPlus size={16} color="#191C18" />
            )}
            <Button.Label>Create user</Button.Label>
          </Button>
        </SectionCard>
      ) : null}
    </>
  );
}
