"use client";

import { useMemo, useState } from "react";
import type { FirmwareTarget } from "@/lib/firmware";

declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<SerialPort>;
    };
  }

  interface SerialPort {
    getInfo?: () => {
      usbVendorId?: number;
      usbProductId?: number;
    };
  }
}

interface FirmwareInstallerProps {
  targets: FirmwareTarget[];
}

function formatUsbId(value?: number) {
  if (typeof value !== "number") {
    return "unknown";
  }

  return `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

export default function FirmwareInstaller({ targets }: FirmwareInstallerProps) {
  const [selectedSlug, setSelectedSlug] = useState(targets[0]?.slug ?? "");
  const [connectionStatus, setConnectionStatus] = useState("No device connected.");
  const [isConnecting, setIsConnecting] = useState(false);

  const selectedTarget = useMemo(
    () => targets.find((target) => target.slug === selectedSlug) ?? targets[0],
    [selectedSlug, targets],
  );

  async function connectDevice() {
    if (!navigator.serial) {
      setConnectionStatus("Web Serial is not available. Use Chrome or Edge on desktop.");
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("Waiting for USB device selection...");

    try {
      const port = await navigator.serial.requestPort();
      const info = port.getInfo?.();
      setConnectionStatus(
        `USB serial device selected. Vendor ${formatUsbId(info?.usbVendorId)}, product ${formatUsbId(info?.usbProductId)}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection cancelled.";
      setConnectionStatus(message);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Browser installer</p>
          <h2 className="mt-3 text-ink">Connect a Seeed XIAO board</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            This first public version checks that the browser can see the USB serial device and gives the exact target to flash.
            Hosted release binaries can be attached to the same catalog as they are promoted.
          </p>
        </div>
        <button
          type="button"
          onClick={connectDevice}
          disabled={isConnecting}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting ? "Connecting..." : "Connect Device"}
        </button>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div>
          <label htmlFor="firmware-target" className="text-sm font-semibold text-ink">
            Firmware target
          </label>
          <select
            id="firmware-target"
            value={selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary"
          >
            {targets.map((target) => (
              <option key={target.slug} value={target.slug}>
                {target.name} - {target.board}
              </option>
            ))}
          </select>

          {selectedTarget ? (
            <div className="mt-5 rounded-xl border border-border bg-bg p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedTarget.version}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                  {selectedTarget.platformioEnv}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">{selectedTarget.name}</h3>
              <p className="mt-1 text-sm text-muted">{selectedTarget.board}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">Sensors</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{selectedTarget.sensors.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">Transport</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{selectedTarget.transports.join(", ")}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-bg p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">Connection</p>
          <p className="mt-3 text-sm leading-6 text-ink">{connectionStatus}</p>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">Next step</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Add signed `.bin` artifacts to the release catalog, then wire this panel to the ESP flashing flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
