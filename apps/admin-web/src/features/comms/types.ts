export type AsteriskStatus = {
  connected: boolean;
  version: string | null;
  startupDate: string | null;
  lastReloadDate: string | null;
  callsActive: number | null;
  callsProcessed: number | null;
  message: string;
};

export type ExtensionPresence = 'unknown' | 'online' | 'offline' | 'busy';

export type ExtensionItem = {
  id: string;
  number: string;
  displayName: string;
  enabled: boolean;
  context: string;
  createdAt: string;
  updatedAt: string;
  presence: ExtensionPresence;
  contacts: number | null;
};

export type CreateExtensionInput = {
  number: string;
  displayName: string;
  secret: string;
  enabled?: boolean;
  context?: string;
};

export type UpdateExtensionInput = {
  displayName?: string;
  secret?: string;
  enabled?: boolean;
  context?: string;
};

export type ActiveCall = {
  channel: string;
  callerIdNum: string;
  callerIdName: string;
  connectedLineNum: string;
  connectedLineName: string;
  state: string;
  application: string;
  duration: string;
  bridgeId: string;
};

export type CdrItem = {
  uniqueid: string;
  calldate: string;
  src: string;
  dst: string;
  clid: string;
  disposition: string;
  duration: number;
  billsec: number;
  channel: string;
  dstchannel: string;
  lastapp: string;
};
