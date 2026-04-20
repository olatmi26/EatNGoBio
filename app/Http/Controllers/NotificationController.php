<?php
namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'notifications' => $this->service->forUser(auth()->id()),
            'unreadCount'   => $this->service->unreadCount(auth()->id()),
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $this->service->markRead($id);
        return response()->json(['ok' => true]);
    }

    public function markAllRead(): JsonResponse
    {
        $this->service->markAllRead(auth()->id());
        return response()->json(['ok' => true]);
    }
}
