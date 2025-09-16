import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * WebRTC P2P Video Call Hook
 * 
 * Implements standard WebRTC flow:
 * 1. Initialize RTCPeerConnection with STUN servers
 * 2. Get user media (camera + microphone)
 * 3. Add media tracks to peer connection
 * 4. Create and exchange SDP offers/answers
 * 5. Exchange ICE candidates
 * 6. Establish P2P connection
 * 
 * Standards compliant with:
 * - RFC 5245 (Interactive Connectivity Establishment - ICE)
 * - RFC 4566 (Session Description Protocol - SDP)
 * - RFC 3264 (Offer/Answer Protocol)
 * - WebRTC 1.0 W3C Recommendation
 */

export interface SignalingData {
  type: 'offer' | 'answer';
  sdp: string;
  iceCandidates: RTCIceCandidate[];
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  connectionState: RTCPeerConnectionState;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  createOffer: () => Promise<SignalingData>;
  handleAnswer: (answerData: SignalingData) => Promise<void>;
  createAnswer: (offerData: SignalingData) => Promise<SignalingData>;
  handleOffer: (answerData: SignalingData) => Promise<void>;
  resetConnection: () => void;
}

const ICE_SERVERS = [
  // Google STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  
  // Cloudflare STUN servers (backup)
  { urls: 'stun:stun.cloudflare.com:3478' },
  
  // Mozilla STUN servers (backup)
  { urls: 'stun:stun.services.mozilla.com:3478' }
];

export const useWebRTC = (): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false); // Start with false until camera is actually started
  const [isMicOn, setIsMicOn] = useState(false); // Start with false until mic is actually started
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const isCreatingAnswerRef = useRef<boolean>(false);
  const isActivelyConnectingRef = useRef<boolean>(false);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10, // Pre-gather more ICE candidates
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
      setIsConnected(state === 'connected');
      
      // Only show connecting state when we're actively trying to connect
      // Not during offer creation or answer creation
      if (isActivelyConnectingRef.current && state === 'connecting') {
        setIsConnecting(true);
      } else if (state === 'connected' || state === 'disconnected' || state === 'failed') {
        setIsConnecting(false);
        isActivelyConnectingRef.current = false;
      }
      
      console.log('Connection state changed:', state, 'Actively connecting:', isActivelyConnectingRef.current, 'Creating answer:', isCreatingAnswerRef.current);
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
    };

    // Collect ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated');
        iceCandidatesRef.current.push(event.candidate);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      
      // Handle different ICE states
      switch (peerConnection.iceConnectionState) {
        case 'connected':
          console.log('ICE connection established');
          break;
        case 'disconnected':
          console.log('ICE connection disconnected');
          break;
        case 'failed':
          console.log('ICE connection failed');
          // Could attempt reconnection here
          break;
        case 'closed':
          console.log('ICE connection closed');
          break;
      }
    };
    
    // Handle ICE gathering state changes
    peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', peerConnection.iceGatheringState);
    };

    peerConnectionRef.current = peerConnection;
    iceCandidatesRef.current = [];
  }, []);

  // Start camera and microphone
  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      setLocalStream(stream);
      
      // Set camera and mic state based on actual track availability and enabled state
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      setIsCameraOn(videoTrack ? videoTrack.enabled : false);
      setIsMicOn(audioTrack ? audioTrack.enabled : false);

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }

      console.log('Camera started successfully');
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }, []);

  // Stop camera and microphone
  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
    setIsCameraOn(false);
    setIsMicOn(false);
  }, [localStream]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setIsCameraOn(newState);
        console.log('Camera toggled:', newState);
      } else {
        console.warn('No video track found');
      }
    } else {
      console.warn('No local stream available');
    }
  }, [localStream]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setIsMicOn(newState);
        console.log('Microphone toggled:', newState);
      } else {
        console.warn('No audio track found');
      }
    } else {
      console.warn('No local stream available');
    }
  }, [localStream]);

  // Create offer (Caller)
  const createOffer = useCallback(async (): Promise<SignalingData> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Creating offer...');
      iceCandidatesRef.current = [];

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      // Wait for ICE candidates to be gathered with timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('ICE gathering timeout, proceeding with collected candidates');
          resolve();
        }, 2000); // 2 second timeout

        const checkIceGathering = () => {
          if (peerConnectionRef.current?.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkIceGathering, 100);
          }
        };
        checkIceGathering();
      });

      const signalingData: SignalingData = {
        type: 'offer',
        sdp: offer.sdp!,
        iceCandidates: iceCandidatesRef.current,
      };

      console.log('Offer created with', iceCandidatesRef.current.length, 'ICE candidates');
      return signalingData;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }, []);

  // Handle answer (Caller)
  const handleAnswer = useCallback(async (answerData: SignalingData) => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Handling answer...');
      isCreatingAnswerRef.current = false; // Make sure we're not in answer creation mode
      isActivelyConnectingRef.current = true; // Now we're actively connecting
      setIsConnecting(true);

      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerData.sdp,
      });

      await peerConnectionRef.current.setRemoteDescription(answer);

      // Add ICE candidates
      for (const candidate of answerData.iceCandidates) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }

      console.log('Answer handled successfully');
    } catch (error) {
      console.error('Error handling answer:', error);
      setIsConnecting(false);
      throw error;
    }
  }, []);

  // Create answer (Callee)
  const createAnswer = useCallback(async (offerData: SignalingData): Promise<SignalingData> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Creating answer...');
      iceCandidatesRef.current = [];
      isCreatingAnswerRef.current = true;

      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: offerData.sdp,
      });

      await peerConnectionRef.current.setRemoteDescription(offer);

      // Add ICE candidates from offer
      for (const candidate of offerData.iceCandidates) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      // Wait for ICE candidates to be gathered with timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('ICE gathering timeout for answer, proceeding with collected candidates');
          resolve();
        }, 2000); // 2 second timeout

        const checkIceGathering = () => {
          if (peerConnectionRef.current?.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkIceGathering, 100);
          }
        };
        checkIceGathering();
      });

      const signalingData: SignalingData = {
        type: 'answer',
        sdp: answer.sdp!,
        iceCandidates: iceCandidatesRef.current,
      };

      console.log('Answer created with', iceCandidatesRef.current.length, 'ICE candidates');
      isCreatingAnswerRef.current = false;
      return signalingData;
    } catch (error) {
      console.error('Error creating answer:', error);
      isCreatingAnswerRef.current = false;
      throw error;
    }
  }, []);

  // Handle offer (Callee) - alias for createAnswer
  const handleOffer = useCallback(async (answerData: SignalingData) => {
    await createAnswer(answerData);
  }, [createAnswer]);

  // Reset connection
  const resetConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionState('new');
    isActivelyConnectingRef.current = false;
    isCreatingAnswerRef.current = false;
    initializePeerConnection();
  }, [initializePeerConnection]);

  // Initialize peer connection on mount
  useEffect(() => {
    initializePeerConnection();
    
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [initializePeerConnection]);

  return {
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
    handleOffer,
    resetConnection,
  };
};