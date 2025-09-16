'use client';

import { useEffect, useRef } from 'react';
import { VideoOff, Video, Mic, MicOff } from 'lucide-react';

interface VideoDisplayProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  label: string;
  className?: string;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({
  stream,
  isLocal = false,
  isCameraOn = true,
  isMicOn = true,
  label,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted={isLocal} // Mute local video to prevent echo
            playsInline
            className={`w-full h-full object-cover ${
              isLocal ? 'transform scale-x-[-1]' : ''
            } ${!isCameraOn ? 'opacity-0' : 'opacity-100'}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800">
              <VideoOff className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <VideoOff className="w-16 h-16 text-gray-400" />
        </div>
      )}
      
      {/* Status Overlay */}
      <div className="absolute top-3 left-3 flex items-center space-x-2">
        <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
          {label}
        </span>
      </div>
      
      {/* Audio/Video Status Indicators */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        {stream && (
          <>
            {/* Camera Status */}
            <div className="bg-black bg-opacity-70 rounded-full p-1.5">
              {isCameraOn ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <VideoOff className="w-4 h-4 text-red-400" />
              )}
            </div>
            
            {/* Microphone Status */}
            <div className="bg-black bg-opacity-70 rounded-full p-1.5">
              {isMicOn ? (
                <Mic className="w-4 h-4 text-white" />
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};