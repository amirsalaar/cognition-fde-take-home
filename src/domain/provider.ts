import type { VirtualEnvironment } from "@prisma/client";

export type FlagValue = { enabled: boolean; rolloutPercentage: number };

export type ProviderResult =
  | { ok: true; providerVersion: number; previous: FlagValue }
  | { ok: false; error: string };

export type ProviderStore = {
  read(flagKey: string, environment: VirtualEnvironment): Promise<
    (FlagValue & { providerVersion: number }) | null
  >;
  write(
    flagKey: string,
    environment: VirtualEnvironment,
    value: FlagValue,
    providerVersion: number,
  ): Promise<void>;
};

export interface FeatureFlagProvider {
  applyChange(
    flagKey: string,
    environment: VirtualEnvironment,
    proposed: FlagValue,
  ): Promise<ProviderResult>;
  rollbackChange(
    flagKey: string,
    environment: VirtualEnvironment,
    restoreTo: FlagValue,
  ): Promise<ProviderResult>;
}

// Deterministic local fake. State lives in the demo database, so provider
// writes commit atomically with workflow state and audit rows. A real remote
// provider could not share that transaction (see PRODUCTION-GAPS.md).
export class FakeFlagProvider implements FeatureFlagProvider {
  constructor(
    private readonly store: ProviderStore,
    private readonly failOn?: (flagKey: string) => boolean,
  ) {}

  private async mutate(
    flagKey: string,
    environment: VirtualEnvironment,
    value: FlagValue,
    verb: string,
  ): Promise<ProviderResult> {
    if (this.failOn?.(flagKey)) {
      return { ok: false, error: `Fake provider refused to ${verb} ${flagKey}.` };
    }
    const current = await this.store.read(flagKey, environment);
    if (current === null) {
      return { ok: false, error: `Unknown flag ${flagKey} in ${environment}.` };
    }
    const providerVersion = current.providerVersion + 1;
    await this.store.write(flagKey, environment, value, providerVersion);
    return {
      ok: true,
      providerVersion,
      previous: { enabled: current.enabled, rolloutPercentage: current.rolloutPercentage },
    };
  }

  applyChange(flagKey: string, environment: VirtualEnvironment, proposed: FlagValue) {
    return this.mutate(flagKey, environment, proposed, "apply");
  }

  rollbackChange(flagKey: string, environment: VirtualEnvironment, restoreTo: FlagValue) {
    return this.mutate(flagKey, environment, restoreTo, "roll back");
  }
}
