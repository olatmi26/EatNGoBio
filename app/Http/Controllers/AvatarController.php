<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function show($filename)
    {
        $path = 'avatars/' . $filename;
        
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }
        
        $filePath = Storage::disk('public')->path($path);
        $mimeType = mime_content_type($filePath);
        
        return response()->file($filePath, [
            'Content-Type' => $mimeType
        ]);
    }
}