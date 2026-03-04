import React, { useEffect, useRef, useMemo } from 'react';
import { SwingFrame, DetectedPhases } from './SwingStateMachine';
import { drawSkeleton, interpolateKeypoints } from '../utils/skeletonRenderer';
import { drawAngleOverlays } from '../utils/angleCalculator';
import { drawFaultArrows } from '../utils/faultArrowRenderer';
import { ArcPoint, ReferencePlane, drawSwingArc } from '../utils/swingPlaneCalculator';

export type AnalysisMode = 'critique' | 'swingPath' | 'angles';

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
}

interface Props {
  videoRef:        React.RefObject<HTMLVideoElement | null>;
  allFrames:       SwingFrame[];
  phaseFrames:     DetectedPhases | null;
  angle:           'dtl' | 'faceOn';
  // Mode system
  analysisMode:    AnalysisMode;
  activePhase:     string;
  faults:          Fault[];
  assessedChecks:  string[];
  // Swing path mode
  swingArc:        ArcPoint[];
  referencePlane:  ReferencePlane | null;
}

function findBracketingFrames(
  frames: SwingFrame[],
  currentTime: number
): { frameA: SwingFrame; frameB: SwingFrame; t: number } {
  if (frames.length === 0) return { frameA: frames[0], frameB: frames[0], t: 0 };

  if (currentTime <= frames[0].time) {
    return { frameA: frames[0], frameB: frames[0], t: 0 };
  }
  if (currentTime >= frames[frames.length - 1].time) {
    const last = frames[frames.length - 1];
    return { frameA: last, frameB: last, t: 0 };
  }

  for (let i = 0; i < frames.length - 1; i++) {
    if (currentTime >= frames[i].time && currentTime <= frames[i + 1].time) {
      const dt = frames[i + 1].time - frames[i].time;
      const t  = dt > 0 ? (currentTime - frames[i].time) / dt : 0;
      return { frameA: frames[i], frameB: frames[i + 1], t };
    }
  }

  const last = frames[frames.length - 1];
  return { frameA: last, frameB: last, t: 0 };
}

export default function OverlayCanvas({
  videoRef,
  allFrames,
  phaseFrames,
  angle,
  analysisMode,
  activePhase,
  faults,
  assessedChecks,
  swingArc,
  referencePlane,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video || allFrames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const vw = video.clientWidth;
      const vh = video.clientHeight;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width  = vw;
        canvas.height = vh;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const currentTime = video.currentTime;
      const { frameA, frameB, t } = findBracketingFrames(allFrames, currentTime);
      const kps = interpolateKeypoints(frameA, frameB, t);

      const nativeW = video.videoWidth  || canvas.width;
      const nativeH = video.videoHeight || canvas.height;

      // Account for object-fit:contain letterboxing/pillarboxing.
      // The canvas covers the full container but the video content may be centered
      // with black bars — keypoints must be offset to match.
      const videoAspect  = nativeW / nativeH;
      const canvasAspect = canvas.width / canvas.height;
      let displayW: number, displayH: number, offsetX: number, offsetY: number;
      if (videoAspect > canvasAspect) {
        // Wider than container → letterbox (bars top/bottom)
        displayW = canvas.width;
        displayH = canvas.width / videoAspect;
        offsetX  = 0;
        offsetY  = (canvas.height - displayH) / 2;
      } else {
        // Taller than container → pillarbox (bars left/right)
        displayH = canvas.height;
        displayW = canvas.height * videoAspect;
        offsetX  = (canvas.width - displayW) / 2;
        offsetY  = 0;
      }
      const scaleX = displayW / nativeW;
      const scaleY = displayH / nativeH;

      const scaledKps = kps.map((kp: any) => ({
        ...kp,
        x: kp.x * scaleX + offsetX,
        y: kp.y * scaleY + offsetY,
      }));

      // Always draw user skeleton
      drawSkeleton(ctx, scaledKps, {
        color:       '#3fb950',
        opacity:     0.9,
        jointRadius: 5,
        lineWidth:   2.5,
        glow:        true,
      });

      // Mode-specific overlays
      if (analysisMode === 'critique') {
        drawFaultArrows(ctx, scaledKps, faults, activePhase, assessedChecks);
      }

      if (analysisMode === 'swingPath') {
        drawSwingArc(ctx, swingArc, referencePlane, scaleX, scaleY);
      }

      if (analysisMode === 'angles') {
        drawAngleOverlays(ctx, scaledKps, angle);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [allFrames, phaseFrames, analysisMode, activePhase, faults, assessedChecks, swingArc, referencePlane, angle, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="overlay-canvas"
    />
  );
}
