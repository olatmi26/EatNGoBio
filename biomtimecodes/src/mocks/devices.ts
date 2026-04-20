export interface Device {
  id: string;
  sn: string;
  name: string;
  area: string;
  ip: string;
  timezone: string;
  transferMode: string;
  status: 'online' | 'offline' | 'syncing';
  lastActivity: string;
  users: number;
  fp: number;
  face: number;
  firmware: string;
  heartbeat: number;
}

export const mockDeviceList: Device[] = [
  { id: 'DEV001', sn: 'BQC2235300158', name: 'Central Support Unit', area: 'HEAD OFFICE', ip: '172.16.1.196', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:11', users: 126, fp: 303, face: 114, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV002', sn: 'BQC2254800020', name: 'AROMIRE BIOMETRICS', area: 'AROMIRE STORE', ip: '192.168.101.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:07', users: 16, fp: 32, face: 12, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV003', sn: 'BQC2254800021', name: 'IKOTUN BIOMETRICS', area: 'IKOTUN', ip: '192.168.105.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:14', users: 1, fp: 2, face: 1, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV004', sn: 'BQC2254800045', name: 'OGUDU BIOMETRICS', area: 'OGUDU', ip: '192.168.104.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:14', users: 2, fp: 3, face: 2, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV005', sn: 'BQC2254800046', name: 'AGIDINGBI BIOMETRICS', area: 'AGIDINGBI', ip: '192.168.19.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:10', users: 0, fp: 0, face: 0, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV006', sn: 'BQC2254800047', name: 'EGBEDA STORE BIOMETRICS', area: 'EGBEDA STORE', ip: '192.168.20.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:09', users: 2, fp: 4, face: 2, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV007', sn: 'BQC2254800048', name: 'ILUPEJU BIOMETRICS', area: 'ILUPEJU', ip: '192.168.21.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'offline', lastActivity: '2026-04-15 18:30:00', users: 1, fp: 2, face: 1, firmware: 'Ver 6.55', heartbeat: 10 },
  { id: 'DEV008', sn: 'BQC2254800049', name: 'TOYIN-STORE BIOMETRICS', area: 'TOYIN STORE', ip: '192.168.22.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:08', users: 2, fp: 4, face: 2, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV009', sn: 'BQC2254800050', name: 'MARYLAND BIOMETRICS', area: 'MARYLAND', ip: '192.168.23.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'online', lastActivity: '2026-04-16 09:17:06', users: 1, fp: 2, face: 1, firmware: 'Ver 6.60', heartbeat: 10 },
  { id: 'DEV010', sn: 'BQC2254800051', name: 'Magboro-Commissary BIO', area: 'Magboro-Commissary', ip: '192.168.24.199', timezone: 'Africa/Lagos', transferMode: 'Real-Time', status: 'syncing', lastActivity: '2026-04-16 09:16:55', users: 108, fp: 216, face: 108, firmware: 'Ver 6.60', heartbeat: 10 },
];
