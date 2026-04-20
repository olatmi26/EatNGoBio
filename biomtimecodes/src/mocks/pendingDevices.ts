export interface PendingDevice {
  id: string;
  sn: string;
  ip: string;
  model: string;
  firmware: string;
  firstSeen: string;
  lastHeartbeat: string;
  status: 'pending' | 'provisioning' | 'rejected';
  requestCount: number;
  suggestedName?: string;
}

export const mockPendingDevices: PendingDevice[] = [
  {
    id: 'PD001',
    sn: 'BQC2254800099',
    ip: '192.168.30.199',
    model: 'ZKTeco K40',
    firmware: 'Ver 6.60',
    firstSeen: '2026-04-16 08:45:12',
    lastHeartbeat: '2026-04-16 09:17:30',
    status: 'pending',
    requestCount: 14,
    suggestedName: 'SURULERE BIOMETRICS',
  },
  {
    id: 'PD002',
    sn: 'BQC2254800100',
    ip: '192.168.31.199',
    model: 'ZKTeco F22',
    firmware: 'Ver 6.55',
    firstSeen: '2026-04-16 09:02:44',
    lastHeartbeat: '2026-04-16 09:17:28',
    status: 'pending',
    requestCount: 7,
    suggestedName: 'FESTAC BIOMETRICS',
  },
];
