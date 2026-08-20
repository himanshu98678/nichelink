export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const configuredServers = (import.meta as any).env.VITE_WEBRTC_ICE_SERVERS;

const parseConfiguredServers = (): IceServerConfig[] => {
  if (!configuredServers) return [];
  try {
    const parsed = JSON.parse(configuredServers);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const fallbackStun = (import.meta as any).env.VITE_WEBRTC_STUN_URL || 'stun:stun.l.google.com:19302';
const configuredTurnUrl = (import.meta as any).env.VITE_WEBRTC_TURN_URL;
const configuredTurnUsername = (import.meta as any).env.VITE_WEBRTC_TURN_USERNAME;
const configuredTurnCredential = (import.meta as any).env.VITE_WEBRTC_TURN_CREDENTIAL;

export const WEBRTC_ICE_SERVERS: IceServerConfig[] = [
  { urls: fallbackStun },
  ...parseConfiguredServers(),
  ...(configuredTurnUrl && configuredTurnUsername && configuredTurnCredential
    ? [{ urls: configuredTurnUrl, username: configuredTurnUsername, credential: configuredTurnCredential }]
    : []),
];