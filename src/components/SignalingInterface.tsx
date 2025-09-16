'use client';

import { useState } from 'react';
import { Copy, Check, Send, Loader } from 'lucide-react';
import { SignalingData } from '@/hooks/useWebRTC';

interface SignalingInterfaceProps {
  role: 'caller' | 'callee' | null;
  offerData: SignalingData | null;
  answerData: SignalingData | null;
  isCreatingOffer: boolean;
  isCreatingAnswer: boolean;
  isConnecting: boolean;
  onCreateOffer: () => void;
  onCreateAnswer: (offerData: SignalingData) => void;
  onHandleAnswer: (answerData: SignalingData) => void;
  onSetRole: (role: 'caller' | 'callee') => void;
}

export const SignalingInterface: React.FC<SignalingInterfaceProps> = ({
  role,
  offerData,
  answerData,
  isCreatingOffer,
  isCreatingAnswer,
  isConnecting,
  onCreateOffer,
  onCreateAnswer,
  onHandleAnswer,
  onSetRole,
}) => {
  const [offerInput, setOfferInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [offerCopied, setOfferCopied] = useState(false);
  const [answerCopied, setAnswerCopied] = useState(false);

  const handleCopyOffer = async () => {
    if (offerData) {
      await navigator.clipboard.writeText(JSON.stringify(offerData, null, 2));
      setOfferCopied(true);
      setTimeout(() => setOfferCopied(false), 2000);
    }
  };

  const handleCopyAnswer = async () => {
    if (answerData) {
      await navigator.clipboard.writeText(JSON.stringify(answerData, null, 2));
      setAnswerCopied(true);
      setTimeout(() => setAnswerCopied(false), 2000);
    }
  };

  const handleSubmitOffer = () => {
    try {
      const parsedOffer = JSON.parse(offerInput);
      onCreateAnswer(parsedOffer);
    } catch (error) {
      alert('Invalid JSON format for offer data');
    }
  };

  const handleSubmitAnswer = () => {
    try {
      const parsedAnswer = JSON.parse(answerInput);
      onHandleAnswer(parsedAnswer);
    } catch (error) {
      alert('Invalid JSON format for answer data');
    }
  };

  if (!role) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-center">Choose Your Role</h3>
        <p className="text-gray-600 mb-6 text-center">
          Select whether you want to start the call (Caller) or join a call (Callee)
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => onSetRole('caller')}
            className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Start Call (Caller)
          </button>
          <button
            onClick={() => onSetRole('callee')}
            className="flex-1 border-2 border-black text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Join Call (Callee)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-center">
        {role === 'caller' ? 'Starting Call' : 'Joining Call'}
      </h3>

      {role === 'caller' && (
        <div className="space-y-6">
          {/* Step 1: Create Offer */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Step 1: Create Offer</h4>
              {offerData && <Check className="w-5 h-5 text-green-500" />}
            </div>
            {!offerData ? (
              <button
                onClick={onCreateOffer}
                disabled={isCreatingOffer}
                className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreatingOffer ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Creating Offer...</span>
                  </>
                ) : (
                  <span>Create Offer</span>
                )}
              </button>
            ) : (
              <div>
                <textarea
                  readOnly
                  value={JSON.stringify(offerData, null, 2)}
                  className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50"
                />
                <button
                  onClick={handleCopyOffer}
                  className={`mt-2 w-full px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2 ${
                    offerCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  {offerCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Offer</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Paste Answer */}
          {offerData && (
            <div className="border border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Step 2: Paste Answer from Callee</h4>
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Paste the answer JSON here..."
                className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-xs"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answerInput.trim() || isConnecting}
                className="mt-2 w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {role === 'callee' && (
        <div className="space-y-6">
          {/* Step 1: Paste Offer */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Step 1: Paste Offer from Caller</h4>
            <textarea
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
              placeholder="Paste the offer JSON here..."
              className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-xs"
            />
            <button
              onClick={handleSubmitOffer}
              disabled={!offerInput.trim() || isCreatingAnswer}
              className="mt-2 w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCreatingAnswer ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating Answer...</span>
                </>
              ) : (
                <span>Create Answer</span>
              )}
            </button>
          </div>

          {/* Step 2: Copy Answer */}
          {answerData && (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Step 2: Copy Answer to Send to Caller</h4>
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <textarea
                readOnly
                value={JSON.stringify(answerData, null, 2)}
                className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50"
              />
              <button
                onClick={handleCopyAnswer}
                className={`mt-2 w-full px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2 ${
                  answerCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                {answerCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Answer</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
