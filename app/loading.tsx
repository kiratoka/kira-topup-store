// app/loading.tsx
"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        switch (prev) {
          case "Initializing":
            return "Connecting";
          case "Connecting":
            return "Processing";
          case "Processing":
            return "Loading";
          default:
            return "Initializing";
        }
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  const hexagonPoints = "50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="relative w-64 h-64">
        {/* Rotating Outer Ring */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon
              points={hexagonPoints}
              fill="none"
              stroke="rgba(0, 255, 255, 0.2)"
              strokeWidth="0.5"
              className="opacity-20"
            />
          </svg>
        </motion.div>

        {/* Pulsing Middle Ring */}
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon
              points={hexagonPoints}
              fill="none"
              stroke="#00ffff"
              strokeWidth="0.3"
            />
          </svg>
        </motion.div>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Progress Circle */}
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#00ffff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              className="transform -rotate-90 origin-center"
            />
          </svg>
          
          {/* Loading Text */}
          <motion.div
            className="mt-4 text-cyan-500 text-sm font-mono"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {loadingText}
          </motion.div>
          
          {/* Progress Percentage */}
          <div className="absolute text-cyan-500 font-mono text-xl">
            {progress}%
          </div>
        </div>

        {/* Scanning Line Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-500/20 to-transparent"
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: 200, opacity: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ height: "10px" }}
        />
      </div>
    </div>
  );
}