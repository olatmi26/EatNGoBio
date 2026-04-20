# ZKTeco ADMS Backend — EatNGo Africa
## Replaces ZKBioTime (no license limit — supports all 87 devices)

---

## How it works

ZKTeco biometric devices use a simple HTTP push protocol called **ADMS**.
The device periodically calls your server at:

```
GET  http://YOUR-SERVER/iclock/cdata?SN=<serial>&options=all   ← handshake
POST http://YOUR-SERVER/iclock/cdata?SN=<serial>&table=ATTLOG  ← push punches
GET  http://YOUR-SERVER/iclock/getrequest?SN=<serial>          ← poll commands
POST http://YOUR-SERVER/iclock/devicecmd?SN=<serial>           ← command result
```

**There is no license check.** The device just needs the server URL configured.
Once configured, the device auto-registers and starts pushing attendance data.

---

## Files Delivered

| File | Purpose |
|------|---------|
| `ADMSController.php` | Core ZKTeco protocol handler (device-facing endpoints) |
| `DashboardApiController.php` | REST API for the React frontend |
| `Models.php` | Device, AttendanceLog, Employee, DeviceCommand models |
| `migrations.php` | 4 database migration templates |
| `zk_routes.php` | All routes (device protocol + dashboard API) |
| `DeviceSeeder.php` | Seeds all 87 store devices from your PDF |
| `ZKDashboard.jsx` | Full React dashboard (preview in Claude artifacts) |

---

## Deployment Steps

### 1. Copy files into your EDLP-POS Laravel project

```bash
# Controllers
cp ADMSController.php       app/Http/Controllers/ADMSController.php
cp DashboardApiController.php app/Http/Controllers/DashboardApiController.php

# Separate the combined Models.php into individual files:
# → app/Models/Device.php
# → app/Models/AttendanceLog.php
# → app/Models/Employee.php
# → app/Models/DeviceCommand.php

# Seeder
cp DeviceSeeder.php database/seeders/DeviceSeeder.php
```

### 2. Add routes

In `routes/web.php`, add at the bottom:
```php
require base_path('routes/zk_routes.php');
```

### 3. Exclude ICLOCK from CSRF

In `app/Http/Middleware/VerifyCsrfToken.php`:
```php
protected $except = [
    'iclock/*',
];
```

### 4. Run migrations

```bash
php artisan migrate
php artisan db:seed --class=DeviceSeeder
```

### 5. Configure devices

On each ZKTeco device screen:
```
Menu → Comm → Cloud Server Settings
  ADMS: Enable
  Server Address: http://YOUR-SERVER-IP
  Port: 8089  (or whatever port Laravel runs on)
```

The device will appear automatically in the dashboard within ~30 seconds.

---

## Network Architecture

```
[Store Device] ──HTTP──▶ [Your Server :8089] ──▶ [MySQL DB]
                              │
                    [React Dashboard]
                              │
                    [HR/Payroll Team]
```

Each store device needs to reach your server. Options:
- **VPN (recommended)**: OpenVPN or WireGuard between all stores and HQ server
- **Direct internet**: Your server has a public IP, firewall allows inbound :8089
- **Existing setup**: If devices already reach biometrics.eatngo-africa.com:8089, just point them at your new server instead

---

## Punch Type Reference

| Code | Meaning |
|------|---------|
| 0 | Check In |
| 1 | Check Out |
| 2 | Break Out |
| 3 | Break In |
| 4 | Overtime In |
| 5 | Overtime Out |

## Verify Type Reference

| Code | Meaning |
|------|---------|
| 1 | Fingerprint |
| 4 | Password/PIN |
| 15 | Face |
| 6 | Card |

---

## Dashboard API Endpoints (for React frontend)

```
GET  /api/zk/stats              → dashboard summary stats
GET  /api/zk/realtime           → last 30 punches (poll every 10s)
GET  /api/zk/devices            → all devices with online status
GET  /api/zk/devices/{sn}       → single device + recent logs
GET  /api/zk/attendance         → paginated logs (filter: date, device, employee)
GET  /api/zk/employees          → employee list
POST /api/zk/commands           → send command to device (REBOOT, INFO, etc.)
GET  /api/zk/reports/daily      → daily attendance report with hours worked
```

---

## Sending Commands to Devices

You can send commands to any device via the API:

```bash
# Reboot a device
POST /api/zk/commands
{ "device_sn": "BQC2254800320", "command": "REBOOT" }

# Get device info
POST /api/zk/commands  
{ "device_sn": "BQC2254800320", "command": "INFO" }
```

The device picks up the command on its next `/iclock/getrequest` poll (~10 seconds).

---

## Adding to EDLP POS

Since this shares the same Laravel codebase as EDLP-POS, you can:
1. Link attendance data to POS employees by matching `employee_pin` → `employees.id`
2. Show attendance summary on the POS admin dashboard
3. Use attendance data for payroll calculations

---

*Built for YUNEXT EXPRESS IT SOLUTIONS / EDLP Nigeria Limited*
*Covers all 87 EatNGo Africa store locations*
