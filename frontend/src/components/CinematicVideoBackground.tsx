import React, { useEffect, useRef, useState } from 'react';

interface CinematicVideoBackgroundProps {
  videoUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CinematicVideoBackground: React.FC<CinematicVideoBackgroundProps> = ({
  videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4",
  className = "",
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [opacity, setOpacity] = useState<number>(1);
  const isResettingRef = useRef<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    video.muted = true;
    video.playsInline = true;

    // Start video playback safely
    const startPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        console.warn("Autoplay interaction blocked or waiting:", err);
      }
    };
    startPlay();

    // Reset video and loop smoothly
    const resetAndLoop = () => {
      if (isResettingRef.current || !isMounted || !video) return;
      isResettingRef.current = true;
      setOpacity(0);

      setTimeout(() => {
        if (!isMounted || !video) return;
        video.currentTime = 0;
        video
          .play()
          .then(() => {
            isResettingRef.current = false;
          })
          .catch(() => {
            isResettingRef.current = false;
          });
      }, 100);
    };

    // Monitor currentTime and duration using requestAnimationFrame
    const monitorProgress = () => {
      if (!video || !isMounted) return;

      const duration = video.duration;
      const currentTime = video.currentTime;

      if (!isResettingRef.current) {
        // 1. Fade in over 0.5s at the start (opacity 0 to 1)
        if (currentTime < 0.5) {
          const fadeInProgress = Math.min(1, Math.max(0, currentTime / 0.5));
          setOpacity(fadeInProgress);
        }
        // 2. Play normally with full opacity
        else if (duration && duration > 0) {
          const fadeOutThreshold = Math.max(0, duration - 0.5);
          if (currentTime >= 0.5 && currentTime < fadeOutThreshold) {
            setOpacity(1);
          }
          // 3. Fade out over 0.5s before the end (opacity 1 to 0)
          else if (currentTime >= fadeOutThreshold) {
            const remaining = duration - currentTime;
            const fadeOutProgress = Math.max(0, Math.min(1, remaining / 0.5));
            setOpacity(fadeOutProgress);

            // 4. When near end or ended: set opacity to 0, wait 100ms, reset currentTime = 0, play() again
            if (remaining <= 0.08 || video.ended) {
              resetAndLoop();
            }
          }
        } else {
          setOpacity(1);
        }
      }

      animFrameRef.current = requestAnimationFrame(monitorProgress);
    };

    animFrameRef.current = requestAnimationFrame(monitorProgress);

    // Also attach ended event as a fallback trigger
    const handleEnded = () => {
      resetAndLoop();
    };
    video.addEventListener('ended', handleEnded);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      video.removeEventListener('ended', handleEnded);
      video.pause();
    };
  }, [videoUrl]);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 top-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      style={style}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="w-full h-full object-cover transition-opacity duration-200 ease-out"
        style={{
          opacity: opacity,
          transition: isResettingRef.current ? 'none' : 'opacity 200ms ease-out',
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-transparent to-slate-50/90 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
    </div>
  );
};
