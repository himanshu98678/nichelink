import React, { useEffect, useRef, useState } from 'react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

export const VideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isResettingRef = useRef<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE_DURATION = 0.5; // 0.5 seconds fade in/out

    const resetAndReplay = async () => {
      if (isResettingRef.current) return;
      isResettingRef.current = true;

      // Set opacity to 0
      setOpacity(0);

      // Pause and wait 100ms
      video.pause();
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        video.currentTime = 0;
        await video.play();
      } catch (err) {
        console.warn('Video playback error during loop reset:', err);
      } finally {
        isResettingRef.current = false;
      }
    };

    const monitorFrame = () => {
      if (video && !isResettingRef.current) {
        const currentTime = video.currentTime;
        const duration = video.duration;

        if (duration && duration > 0) {
          let currentOpacity = 1;

          // Fade in over 0.5s at start (opacity 0 to 1)
          if (currentTime < FADE_DURATION) {
            currentOpacity = Math.min(1, Math.max(0, currentTime / FADE_DURATION));
          }
          // Fade out over 0.5s before end (opacity 1 to 0)
          else if (currentTime > duration - FADE_DURATION) {
            const remaining = duration - currentTime;
            currentOpacity = Math.min(1, Math.max(0, remaining / FADE_DURATION));
          } else {
            currentOpacity = 1;
          }

          // If video is almost at end (within last 0.05s) or ended, trigger seamless loop reset
          if (currentTime >= duration - 0.05) {
            resetAndReplay();
            return;
          }

          setOpacity(currentOpacity);
        }
      }

      animFrameRef.current = requestAnimationFrame(monitorFrame);
    };

    const handleEnded = () => {
      resetAndReplay();
    };

    video.addEventListener('ended', handleEnded);

    // Start playback and frame monitoring loop
    video.play().catch((err) => {
      console.warn('Autoplay prevented by browser:', err);
    });

    animFrameRef.current = requestAnimationFrame(monitorFrame);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div
      className="absolute overflow-hidden pointer-events-none z-0 w-full"
      style={{
        top: '300px',
        inset: 'auto 0 0 0',
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        aria-hidden="true"
        className="w-full h-full object-cover min-h-[600px] transition-opacity duration-75"
        style={{ opacity }}
      />

      {/* Gradient Overlays: absolute inset-0 bg-gradient-to-b from-background via-transparent to-background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />
    </div>
  );
};
