'use client';

import { Loader, Camera, Mic } from 'lucide-react';

interface LoadingScreenProps {
  message: string;
  submessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  submessage,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 p-4 border-2 border-black rounded-lg bg-white">
            <Camera className="w-8 h-8" />
            <div className="w-1 h-8 bg-black" />
            <Mic className="w-8 h-8" />
          </div>
        </div>
        
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="relative">
            <Loader className="w-12 h-12 animate-spin text-black mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <h2 className="text-2xl font-bold text-black mb-2">{message}</h2>
        {submessage && (
          <p className="text-gray-600 max-w-md mx-auto">{submessage}</p>
        )}
      </div>
    </div>
  );
};