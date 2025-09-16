'use client';

import { useState, useCallback } from 'react';
import { Camera, Mic, Video } from 'lucide-react';
import { useWebRTC, SignalingData } from '@/hooks/useWebRTC';
import { VideoDisplay } from '@/components/VideoDisplay';
import { ControlButtons } from '@/components/ControlButtons';
import { SignalingInterface } from '@/components/SignalingInterface';
import { LoadingScreen } from '@/components/LoadingScreen';
import Image from 'next/image';

type AppState = 'idle' | 'starting-camera' | 'ready' | 'signaling' | 'connected';
type UserRole = 'caller' | 'callee' | null;

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [role, setRole] = useState<UserRole>(null);
  const [offerData, setOfferData] = useState<SignalingData | null>(null);
  const [answerData, setAnswerData] = useState<SignalingData | null>(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isCreatingAnswer, setIsCreatingAnswer] = useState(false);

  const {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    isCameraOn,
    isMicOn,
    connectionState,
    startCamera,
    stopCamera,
    toggleCamera,
    toggleMic,
    createOffer,
    handleAnswer,
    createAnswer,
    resetConnection,
  } = useWebRTC();

  // Start camera when app initializes
  const handleStartCamera = useCallback(async () => {
    setAppState('starting-camera');
    try {
      await startCamera();
      setAppState('ready');
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Failed to access camera and microphone. Please check permissions.');
      setAppState('idle');
    }
  }, [startCamera]);

  // Handle role selection
  const handleSetRole = useCallback((selectedRole: 'caller' | 'callee') => {
    setRole(selectedRole);
    setAppState('signaling');
  }, []);

  // Handle creating offer (Caller)
  const handleCreateOffer = useCallback(async () => {
    setIsCreatingOffer(true);
    try {
      const offer = await createOffer();
      setOfferData(offer);
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert('Failed to create offer');
    } finally {
      setIsCreatingOffer(false);
    }
  }, [createOffer]);

  // Handle creating answer (Callee)
  const handleCreateAnswer = useCallback(async (offer: SignalingData) => {
    setIsCreatingAnswer(true);
    try {
      const answer = await createAnswer(offer);
      setAnswerData(answer);
      // Stay in signaling state - don't auto-connect!
      // User B waits for User A to complete the connection
      console.log('Answer created successfully, waiting for connection from User A');
    } catch (error) {
      console.error('Failed to create answer:', error);
      alert('Failed to create answer');
    } finally {
      setIsCreatingAnswer(false);
    }
  }, [createAnswer]);

  // Handle answering (Caller)
  const handleHandleAnswer = useCallback(async (answer: SignalingData) => {
    try {
      await handleAnswer(answer);
      setAppState('connected');
    } catch (error) {
      console.error('Failed to handle answer:', error);
      alert('Failed to handle answer');
    }
  }, [handleAnswer]);

  // Handle ending call
  const handleEndCall = useCallback(() => {
    resetConnection();
    stopCamera();
    setAppState('idle');
    setRole(null);
    setOfferData(null);
    setAnswerData(null);
  }, [resetConnection, stopCamera]);

  // Update app state based on connection status
  if (isConnected && appState !== 'connected') {
    setAppState('connected');
  }

  // Loading states
  if (appState === 'starting-camera') {
    return (
      <LoadingScreen 
        message="Starting Camera" 
        submessage="Accessing your camera and microphone. Please allow permissions when prompted." 
      />
    );
  }

  if (isConnecting) {
    return (
      <LoadingScreen 
        message="Connecting" 
        submessage="Establishing peer-to-peer connection. This may take a moment." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center space-x-2 p-2 border-2 border-black rounded-lg bg-white">
               <Image className=' size-[40px]' src="/p2pmatch.png" alt="P2P Match Logo" width={40} height={40} />
            </div>
            <div className="font-bold text-xl">P2P Match</div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' 
                ? 'bg-green-500' 
                : connectionState === 'connecting'
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium capitalize">
              {connectionState === 'connected' ? 'Connected' : 
               connectionState === 'connecting' ? 'Connecting' : 
               'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {appState === 'idle' && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-3 p-6 border-4 border-black rounded-2xl bg-white">
                 <Image className=' size-[60px]' src="/p2pmatch.png" alt="P2P Match Logo" width={40} height={40} />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">P2P Video Match</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Peer-to-peer video calling with manual signaling. No servers required.
            </p>
            <button
              onClick={handleStartCamera}
              className="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
            >
              <Camera className="w-6 h-6" />
              <span>Start Camera</span>
            </button>
          </div>
        )}

        {appState === 'ready' && (
          <div className="space-y-8">
            {/* Local Video Preview */}
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">Camera Preview</h2>
              <VideoDisplay
                stream={localStream}
                isLocal={true}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                label="You"
                className="aspect-video"
              />
              
              {/* Basic Controls */}
              <div className="mt-4">
                <ControlButtons
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isConnected={false}
                  onToggleCamera={toggleCamera}
                  onToggleMic={toggleMic}
                  onEndCall={handleEndCall}
                />
              </div>
              
              {/* Role Selection */}
              <div className="mt-8">
                <SignalingInterface
                  role={null}
                  offerData={null}
                  answerData={null}
                  isCreatingOffer={false}
                  isCreatingAnswer={false}
                  isConnecting={false}
                  onCreateOffer={handleCreateOffer}
                  onCreateAnswer={handleCreateAnswer}
                  onHandleAnswer={handleHandleAnswer}
                  onSetRole={handleSetRole}
                />
              </div>
            </div>
          </div>
        )}

        {appState === 'signaling' && (
          <div className="space-y-8">
            {/* Local Video */}
            <div className="max-w-md mx-auto">
              <VideoDisplay
                stream={localStream}
                isLocal={true}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                label="You"
                className="aspect-video"
              />
              
              {/* Controls */}
              <div className="mt-4">
                <ControlButtons
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isConnected={false}
                  onToggleCamera={toggleCamera}
                  onToggleMic={toggleMic}
                  onEndCall={handleEndCall}
                />
              </div>
            </div>
            
            {/* Signaling Interface */}
            <div className="max-w-2xl mx-auto">
              <SignalingInterface
                role={role}
                offerData={offerData}
                answerData={answerData}
                isCreatingOffer={isCreatingOffer}
                isCreatingAnswer={isCreatingAnswer}
                isConnecting={isConnecting}
                onCreateOffer={handleCreateOffer}
                onCreateAnswer={handleCreateAnswer}
                onHandleAnswer={handleHandleAnswer}
                onSetRole={handleSetRole}
              />
            </div>
          </div>
        )}

        {appState === 'connected' && (
          <div className="space-y-6">
            {/* Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Local Video */}
              <VideoDisplay
                stream={localStream}
                isLocal={true}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                label="You"
                className="aspect-video"
              />
              
              {/* Remote Video */}
              <VideoDisplay
                stream={remoteStream}
                isLocal={false}
                isCameraOn={true}
                isMicOn={true}
                label="Remote"
                className="aspect-video"
              />
            </div>
            
            {/* Call Controls */}
            <div className="flex justify-center">
              <ControlButtons
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                isConnected={isConnected}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMic}
                onEndCall={handleEndCall}
              />
            </div>
            
            {/* Connection Info */}
            <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-lg p-4 text-center">
              <p className="text-green-600 font-semibold">
                ✅ Connected! You are now in a peer-to-peer video call.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Connection State: {connectionState}
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto p-4 text-center text-gray-500 text-sm">
          <p>P2P Video Match - Peer-to-peer video calling with WebRTC</p>
        </div>
      </footer>
    </div>
  );
}
