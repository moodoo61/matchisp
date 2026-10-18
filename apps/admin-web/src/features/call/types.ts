export type RegStatus =
  | 'idle'
  | 'connecting'
  | 'registered'
  | 'unregistered'
  | 'failed';

export type CallStatus =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'incoming'
  | 'active'
  | 'ended'
  | 'failed';

export type CallConfig = {
  wssUrl: string;
  sipDomain: string;
};
