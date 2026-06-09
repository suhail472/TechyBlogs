'use client';

import { useState } from 'react';
import { HelpCircle, Check, X, Award, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizWidget({ question, options = [], correctAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isCorrect = selectedOption === correctAnswer;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    setShowFeedback(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setShowFeedback(false);
  };

  return (
    <div className="my-8 rounded-3xl border overflow-hidden bg-white border-zinc-200/80 shadow-xl shadow-zinc-200/10 dark:bg-[#111726]/40 dark:border-white/[0.06] dark:shadow-none relative">
      {/* Visual top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
        submitted 
          ? isCorrect 
            ? 'from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
            : 'from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
          : 'from-blue-500 to-indigo-500'
      }`} />

      <div className="p-6 md:p-8">
        {/* Header indicator */}
        <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>Knowledge Check</span>
        </div>

        {/* Question */}
        <h4 className="text-base md:text-lg font-black tracking-tight text-zinc-900 dark:text-white mb-6 leading-snug">
          {question}
        </h4>

        {/* Options Grid */}
        <div className="space-y-3 mb-6">
          {options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isOptionCorrect = idx === correctAnswer;
            
            let optionStyles = 'border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-50 dark:hover:bg-white/[0.02] text-zinc-700 dark:text-zinc-300';
            let iconElement = null;

            if (submitted) {
              if (isSelected) {
                if (isCorrect) {
                  optionStyles = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                  iconElement = <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
                } else {
                  optionStyles = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-455';
                  iconElement = <X className="w-4 h-4 text-rose-500 shrink-0" />;
                }
              } else if (isOptionCorrect) {
                // Reveal the correct option if the user guessed wrong
                optionStyles = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400/80';
              } else {
                optionStyles = 'opacity-40 border-zinc-200 dark:border-white/[0.04] text-zinc-400 dark:text-zinc-600';
              }
            } else if (isSelected) {
              optionStyles = 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/10';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={submitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-xs font-semibold leading-relaxed transition-all flex items-center justify-between gap-4 ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-lg border text-[10px] font-black flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Action Button & Feedback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
          <div>
            <AnimatePresence mode="wait">
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-xs font-bold"
                >
                  {isCorrect ? (
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Awesome! That is correct.
                    </span>
                  ) : (
                    <span className="text-rose-500">
                      Oops! Incorrect response. Let&apos;s try again!
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 shrink-0 justify-end">
            {submitted && !isCorrect ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedOption === null || submitted}
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  submitted && isCorrect
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/15 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
                }`}
              >
                {submitted && isCorrect ? 'Completed' : 'Submit Answer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
