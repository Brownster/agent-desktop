/**
 * @fileoverview Dialpad component for DTMF tones and dialing
 * @module components/Dialpad
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PhoneIcon,
  BackspaceIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useActiveContact } from '@/store/contact.store';

/**
 * Dialpad component props
 */
interface DialpadProps {
  onDigitPressed?: (digit: string) => void;
  onCall?: (number: string) => void;
  onDTMF?: (digit: string) => void;
  disabled?: boolean;
  showCallButton?: boolean;
  className?: string;
}

/**
 * Dialpad button component
 */
interface DialpadButtonProps {
  digit: string;
  letters?: string;
  onClick: (digit: string) => void;
  disabled?: boolean;
  className?: string;
}

function DialpadButton({
  digit,
  letters,
  onClick,
  disabled = false,
  className,
}: DialpadButtonProps): React.ReactElement {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick(digit);
    }
  }, [digit, onClick, disabled]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      className={clsx(
        'flex flex-col items-center justify-center aspect-square rounded-full text-center transition-all duration-150',
        'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'active:scale-95 active:bg-blue-100',
        disabled && 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white active:scale-100 active:bg-white',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
    >
      <span className="text-xl font-semibold text-gray-900">{digit}</span>
      {letters && (
        <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">
          {letters}
        </span>
      )}
    </button>
  );
}

/**
 * DTMF tone configuration
 */
const DTMF_FREQUENCIES = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
} as const;

/**
 * Dialpad layout configuration
 */
const DIALPAD_LAYOUT = [
  [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
  ],
  [
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
  ],
  [
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
  ],
  [
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ],
];

/**
 * Dialpad component
 */
function Dialpad({
  onDigitPressed,
  onCall,
  onDTMF,
  disabled = false,
  showCallButton = true,
  className,
}: DialpadProps): React.ReactElement {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeContact = useActiveContact();

  /**
   * Initialize audio context
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Play DTMF tone
   */
  const playDTMFTone = useCallback((digit: string) => {
    if (!audioEnabled || !audioContextRef.current || !(digit in DTMF_FREQUENCIES)) {
      return;
    }

    const audioContext = audioContextRef.current;
    const [lowFreq, highFreq] = DTMF_FREQUENCIES[digit as keyof typeof DTMF_FREQUENCIES];

    // Create oscillators for dual-tone
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure oscillators
    oscillator1.frequency.setValueAtTime(lowFreq, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(highFreq, audioContext.currentTime);
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Configure gain (volume)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    // Connect audio nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play tone for 150ms
    const duration = 0.15;
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + duration);
    oscillator2.stop(audioContext.currentTime + duration);

    setIsPlayingTone(true);
    setTimeout(() => setIsPlayingTone(false), duration * 1000);
  }, [audioEnabled]);

  /**
   * Handle digit press
   */
  const handleDigitPress = useCallback((digit: string) => {
    if (disabled) return;

    // Update phone number for dialing mode
    if (!activeContact) {
      setPhoneNumber(prev => prev + digit);
    }

    // Play DTMF tone
    playDTMFTone(digit);

    // Notify parent components
    onDigitPressed?.(digit);
    
    // Send DTMF if in active call
    if (activeContact) {
      onDTMF?.(digit);
    }
  }, [disabled, activeContact, playDTMFTone, onDigitPressed, onDTMF]);

  /**
   * Handle backspace
   */
  const handleBackspace = useCallback(() => {
    if (!activeContact) {
      setPhoneNumber(prev => prev.slice(0, -1));
    }
  }, [activeContact]);

  /**
   * Handle call initiation
   */
  const handleCall = useCallback(() => {
    if (phoneNumber.trim() && onCall) {
      onCall(phoneNumber);
      setPhoneNumber('');
    }
  }, [phoneNumber, onCall]);

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    const length = cleaned.length;

    if (length <= 3) {
      return cleaned;
    } else if (length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (length <= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      return `+${cleaned.slice(0, length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
  };

  /**
   * Handle keyboard input
   */
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      if (key in DTMF_FREQUENCIES || '0123456789*#'.includes(key)) {
        event.preventDefault();
        handleDigitPress(key);
      } else if (key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      } else if (key === 'Enter' && phoneNumber && onCall) {
        event.preventDefault();
        handleCall();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleDigitPress, handleBackspace, handleCall, phoneNumber, onCall]);

  const isDialingMode = !activeContact;
  const isConnectedCall = activeContact?.state === 'connected';

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            {isDialingMode ? 'Dialpad' : 'DTMF Tones'}
          </h3>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={clsx(
              'p-1 rounded-md transition-colors',
              audioEnabled 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-50'
            )}
            title={audioEnabled ? 'Disable tone sounds' : 'Enable tone sounds'}
          >
            {audioEnabled ? (
              <SpeakerWaveIcon className="h-4 w-4" />
            ) : (
              <SpeakerXMarkIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Phone Number Display */}
        {isDialingMode && (
          <div className="mb-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <input
                type="tel"
                value={formatPhoneNumber(phoneNumber)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setPhoneNumber(cleaned);
                }}
                placeholder="Enter phone number"
                className="flex-1 bg-transparent text-lg font-mono text-gray-900 placeholder-gray-500 focus:outline-none"
                disabled={disabled}
              />
              {phoneNumber && (
                <button
                  onClick={handleBackspace}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={disabled}
                >
                  <BackspaceIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {isConnectedCall && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'h-2 w-2 rounded-full',
                isPlayingTone ? 'bg-green-500 animate-pulse' : 'bg-green-400'
              )} />
              <span className="text-sm text-green-800">
                {isPlayingTone ? 'Sending tone...' : 'Ready to send DTMF'}
              </span>
            </div>
          </div>
        )}

        {/* Dialpad Grid */}
        <div className="space-y-3 mb-4">
          {DIALPAD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-3">
              {row.map(({ digit, letters }) => (
                <DialpadButton
                  key={digit}
                  digit={digit}
                  letters={letters}
                  onClick={handleDigitPress}
                  disabled={disabled}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Call Button */}
        {isDialingMode && showCallButton && (
          <button
            onClick={handleCall}
            disabled={!phoneNumber.trim() || disabled}
            className={clsx(
              'w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              phoneNumber.trim() && !disabled
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <PhoneIcon className="h-4 w-4" />
            <span>Call {phoneNumber ? formatPhoneNumber(phoneNumber) : ''}</span>
          </button>
        )}

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          {isDialingMode ? (
            'Enter a phone number and press Call, or use keyboard'
          ) : (
            'Press digits to send DTMF tones during the call'
          )}
        </div>
      </div>
    </div>
  );
}

export default Dialpad;