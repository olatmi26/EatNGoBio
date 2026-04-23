<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;

use App\Services\DeviceCommandService;
use App\Services\DeviceOperationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceApiController extends Controller
{
    public function __construct(
        private DeviceCommandService $commandService,
        private DeviceOperationService $operationService
    ) {}

    /**
     * GET /iclock/api/terminals/ - List all devices (Biotime 8 compatible)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Device::query();
        
        // Filter by SN
        if ($request->has('sn')) {
            $query->where('serial_number', $request->sn);
        }
        
        // Filter by alias (name)
        if ($request->has('alias')) {
            $query->where('name', $request->alias);
        }
        
        // Filter by state (online/offline)
        if ($request->has('state')) {
            if ($request->state == 1) {
                $query->where('status', 'online');
            } else {
                $query->where('status', 'offline');
            }
        }
        
        // Filter by area
        if ($request->has('area')) {
            $query->where('area', $request->area);
        }
        
        // Search by SN or alias
        if ($request->has('sn_icontains')) {
            $query->where('serial_number', 'like', '%' . $request->sn_icontains . '%');
        }
        
        if ($request->has('alias_icontains')) {
            $query->where('name', 'like', '%' . $request->alias_icontains . '%');
        }
        
        $perPage = $request->get('page_size', 15);
        $devices = $query->paginate($perPage);
        
        // Format response like Biotime 8
        return response()->json([
            'count' => $devices->total(),
            'next' => $devices->nextPageUrl(),
            'previous' => $devices->previousPageUrl(),
            'code' => 0,
            'msg' => '',
            'data' => $devices->map(function($device) {
                return [
                    'id' => $device->id,
                    'sn' => $device->serial_number,
                    'ip_address' => $device->ip_address,
                    'alias' => $device->name,
                    'terminal_name' => $device->name,
                    'fw_ver' => $device->firmware,
                    'state' => $device->status === 'online' ? 1 : 0,
                    'terminal_tz' => 1,
                    'area' => [
                        'id' => $device->location_id ?? 1,
                        'area_code' => $device->area ?? 'default',
                        'area_name' => $device->area ?? 'Default Area'
                    ],
                    'last_activity' => $device->last_seen,
                    'user_count' => $device->user_count,
                    'fp_count' => $device->fp_count,
                    'face_count' => $device->face_count,
                    'transaction_count' => $device->attendanceLogs()->count(),
                ];
            })
        ]);
    }

    /**
     * GET /iclock/api/terminals/{id}/ - Get single device
     */
    public function show(int $id): JsonResponse
    {
        $device = Device::findOrFail($id);
        
        return response()->json([
            'code' => 0,
            'msg' => '',
            'data' => [
                'id' => $device->id,
                'sn' => $device->serial_number,
                'ip_address' => $device->ip_address,
                'alias' => $device->name,
                'terminal_name' => $device->name,
                'fw_ver' => $device->firmware,
                'state' => $device->status === 'online' ? 1 : 0,
                'terminal_tz' => 1,
                'area' => [
                    'id' => $device->location_id ?? 1,
                    'area_code' => $device->area ?? 'default',
                    'area_name' => $device->area ?? 'Default Area'
                ],
                'last_activity' => $device->last_seen,
                'user_count' => $device->user_count,
                'fp_count' => $device->fp_count,
                'face_count' => $device->face_count,
                'transaction_count' => $device->attendanceLogs()->count(),
                'transfer_time' => '00:00;14:05',
                'transfer_interval' => 1,
                'is_attendance' => 1,
            ]
        ]);
    }

    /**
     * POST /iclock/api/terminals/upload_all/ - Upload all data from device
     */
    public function uploadAll(Request $request): JsonResponse
    {
        $request->validate([
            'terminals' => 'required|array',
            'terminals.*' => 'integer|exists:devices,id'
        ]);
        
        $results = [];
        foreach ($request->terminals as $terminalId) {
            $device = Device::find($terminalId);
            if ($device && $device->is_online) {
                // Send commands to pull all data
                $commands = [];
                $commands[] = $this->commandService->sendCommand($device, 'SYNC_USER');
                $commands[] = $this->commandService->sendCommand($device, 'GET_ATTLOG');
                $results[$device->serial_number] = [
                    'success' => true,
                    'commands' => count(array_filter($commands))
                ];
            } else {
                $results[$device->serial_number] = [
                    'success' => false,
                    'error' => 'Device offline or not found'
                ];
            }
        }
        
        return response()->json([
            'code' => 0,
            'msg' => 'Upload commands queued',
            'results' => $results
        ]);
    }

    /**
     * POST /iclock/api/terminals/upload_transaction/ - Upload attendance logs only
     */
    public function uploadTransaction(Request $request): JsonResponse
    {
        $request->validate([
            'terminals' => 'required|array',
            'terminals.*' => 'integer|exists:devices,id'
        ]);
        
        $results = [];
        foreach ($request->terminals as $terminalId) {
            $device = Device::find($terminalId);
            if ($device && $device->is_online) {
                $command = $this->commandService->sendCommand($device, 'GET_ATTLOG');
                $results[$device->serial_number] = [
                    'success' => (bool) $command,
                    'command_id' => $command?->id
                ];
            } else {
                $results[$device->serial_number] = [
                    'success' => false,
                    'error' => 'Device offline or not found'
                ];
            }
        }
        
        return response()->json([
            'code' => 0,
            'msg' => 'Transaction upload commands queued',
            'results' => $results
        ]);
    }

    /**
     * POST /iclock/api/terminals/reboot/ - Reboot devices
     */
    public function reboot(Request $request): JsonResponse
    {
        $request->validate([
            'terminals' => 'required|array',
            'terminals.*' => 'integer|exists:devices,id'
        ]);
        
        $results = [];
        foreach ($request->terminals as $terminalId) {
            $device = Device::find($terminalId);
            if ($device && $device->is_online) {
                $command = $this->commandService->sendCommand($device, 'RESTART');
                $results[$device->serial_number] = [
                    'success' => (bool) $command,
                    'command_id' => $command?->id
                ];
            } else {
                $results[$device->serial_number] = [
                    'success' => false,
                    'error' => 'Device offline or not found'
                ];
            }
        }
        
        return response()->json([
            'code' => 0,
            'msg' => 'Reboot commands queued',
            'results' => $results
        ]);
    }

    /**
     * POST /iclock/api/terminals/clear_command/ - Clear pending commands
     */
    public function clearCommand(Request $request): JsonResponse
    {
        $request->validate([
            'terminals' => 'required|array',
            'terminals.*' => 'integer|exists:devices,id'
        ]);
        
        foreach ($request->terminals as $terminalId) {
            DeviceCommand::where('device_id', $terminalId)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);
        }
        
        return response()->json([
            'code' => 0,
            'msg' => 'Pending commands cleared'
        ]);
    }
}