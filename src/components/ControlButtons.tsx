'use client';

import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface ControlButtonsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isConnected: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndCall: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCameraOn,
  isMicOn,
  isConnected,
  onToggleCamera,
  onToggleMic,
  onEndCall,
}) => {
  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Camera Toggle */}
      <button
        onClick={onToggleCamera}
        className={`p-4 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
          isCameraOn
            ? 'bg-white text-black border-black hover:bg-gray-100'
            : 'bg-red-500 text-white border-red-500 hover:bg-red-600'
        }`}
        title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraOn ? (
          <Video className="w-6 h-6" />
        ) : (
          <VideoOff className="w-6 h-6" />
        )}
      </button>

      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-4 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
          isMicOn
            ? 'bg-white text-black border-black hover:bg-gray-100'
            : 'bg-red-500 text-white border-red-500 hover:bg-red-600'
        }`}
        title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
      >
        {isMicOn ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </button>

      {/* End Call */}
      {isConnected && (
        <button
          onClick={onEndCall}
          className="p-4 rounded-full border-2 bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 transition-all duration-200 hover:scale-110"
          title="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};