export type DynamicConfigScope = "GLOBAL" | "ENVIRONMENT" | "WORKSPACE" | "PROVIDER" | "MODEL";
export type DynamicConfigStatus = "ACTIVE" | "SUPERSEDED" | "DISABLED";

export interface DynamicConfigRecord<T = unknown> {
  configKey: string;
  scope: DynamicConfigScope;
  value: T;
  version: number;
  status: DynamicConfigStatus;
  effectiveAt: string;
  changedBy: string;
  reason?: string;
  createdAt: string;
  checksum: string;
}

export interface DynamicConfigSnapshot<T = Record<string, unknown>> {
  version: number;
  effectiveAt: string;
  values: T;
  checksum: string;
  loadedAt: string;
}

export interface DynamicConfigChangeEvent {
  configKey: string;
  scope: DynamicConfigScope;
  version: number;
  effectiveAt: string;
  checksum: string;
}

export interface DynamicConfigStore {
  get<T>(key: string, scope?: DynamicConfigScope): Promise<DynamicConfigRecord<T> | null>;
  getSnapshot<T>(scope?: DynamicConfigScope): Promise<DynamicConfigSnapshot<T>>;
  set<T>(input: Omit<DynamicConfigRecord<T>, "version" | "status" | "createdAt" | "checksum">): Promise<DynamicConfigRecord<T>>;
  rollback(configKey: string, targetVersion: number, changedBy: string, reason: string): Promise<DynamicConfigRecord>;
  subscribe(handler: (event: DynamicConfigChangeEvent) => Promise<void>): Promise<() => Promise<void>>;
}
