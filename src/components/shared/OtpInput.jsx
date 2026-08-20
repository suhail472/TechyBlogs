'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = true,
}) {
  const inputRefs = useRef([]);

  // Split value into array of digits with padding
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Auto-focus the first input or the first empty input on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      if (inputRefs.current[targetIndex]) {
        inputRefs.current[targetIndex].focus();
      }
    }
  }, [autoFocus, disabled]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    const cleaned = rawVal.replace(/\D/g, '');

    if (!cleaned) {
      // User deleted digit
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const nextVal = nextDigits.join('').trim();
      onChange(nextVal);
      return;
    }

    if (cleaned.length === 1) {
      const nextDigits = [...digits];
      nextDigits[index] = cleaned;
      const nextVal = nextDigits.join('');
      onChange(nextVal);

      // Auto-advance focus to next input
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }

      if (nextVal.length === length && onComplete) {
        onComplete(nextVal);
      }
    } else {
      // Pasted or multi-character entry
      handlePastedContent(cleaned);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // If current is empty, jump to previous and clear it
        inputRefs.current[index - 1].focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        const nextVal = nextDigits.join('');
        onChange(nextVal);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e, index) => {
    // Select contents on focus for easy replacement
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData?.getData('text') || '';
    handlePastedContent(pasteData);
  };

  const handlePastedContent = (str) => {
    const cleaned = str.replace(/\D/g, '').slice(0, length);
    if (!cleaned) return;

    onChange(cleaned);

    const focusIndex = Math.min(cleaned.length, length - 1);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }

    if (cleaned.length === length && onComplete) {
      onComplete(cleaned);
    }
  };

  return (
    <motion.div
      animate={error ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-sm mx-auto select-none"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        const isMiddleSeparator = length === 6 && index === 2;

        return (
          <div key={index} className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                disabled={disabled}
                value={digits[index]}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => handleFocus(e, index)}
                aria-label={`Digit ${index + 1} of ${length}`}
                className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl transition-all duration-200 outline-none select-all shadow-sm ${
                  disabled
                    ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-white/5'
                    : error
                    ? 'bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-400 shadow-rose-500/10 focus:ring-4 focus:ring-rose-500/20'
                    : isFilled
                    ? 'bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white text-zinc-950 dark:text-white shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white hover:border-zinc-300 dark:hover:border-white/20 focus:bg-white dark:focus:bg-zinc-800 focus:border-red-600 dark:focus:border-red-500 focus:ring-4 focus:ring-red-600/15'
                }`}
              />

              {/* Subtle empty dot placeholder */}
              {!digits[index] && !disabled && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                </div>
              )}
            </div>

            {/* Visual Divider in the center of 6 digits */}
            {isMiddleSeparator && (
              <span className="text-zinc-300 dark:text-zinc-600 font-bold select-none text-base">
                —
              </span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
