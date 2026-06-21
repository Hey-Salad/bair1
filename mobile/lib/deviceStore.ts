import { create } from 'zustand';

interface DeviceState {
  /** Currently selected device id, or null for demo / aggregate mode. */
  selectedDeviceId: string | null;
  selectDevice: (deviceId: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  selectedDeviceId: null,
  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
}));
