import { useRef, useEffect, useCallback } from 'react';

const SAND_R = 220;
const SAND_G = 207;
const SAND_B = 181;
const SAND_NOISE = 14;
const MAX_UNDO = 30;

const STONE_PRESETS = [
  { base: '#6b6b6b', light: '#8a8a8a', dark: '#4a4a4a' },
  { base: '#8a8078', light: '#a09890', dark: '#6a6058' },
  { base: '#556b70', light: '#7a8a8f', dark: '#3a5055' },
];

export default function useRakingCanvas({ tool, rakeWidth, stoneColor }) {
  const canvasRef = useRef(null);
  const sandCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const undoStackRef = useRef([]);
  const toolRef = useRef(tool);
  const rakeWidthRef = useRef(rakeWidth);
  const stoneColorRef = useRef(stoneColor);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { rakeWidthRef.current = rakeWidth; }, [rakeWidth]);
  useEffect(() => { stoneColorRef.current = stoneColor; }, [stoneColor]);

  const generateSand = useCallback((ctx, w, h) => {
    const imageData = ctx.createImageData(w, h);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * SAND_NOISE;
      data[i] = Math.min(255, Math.max(0, SAND_R + n));
      data[i + 1] = Math.min(255, Math.max(0, SAND_G + n));
      data[i + 2] = Math.min(255, Math.max(0, SAND_B + n));
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.save();
    for (let y = 0; y < h; y += 3 + Math.random() * 5) {
      ctx.strokeStyle = `rgba(180, 170, 150, ${0.03 + Math.random() * 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    undoStackRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return false;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(undoStackRef.current.pop(), 0, 0);
    return true;
  }, []);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushUndo();
    const ctx = canvas.getContext('2d');
    generateSand(ctx, canvas.width, canvas.height);
    if (sandCanvasRef.current) {
      sandCanvasRef.current.getContext('2d').drawImage(canvas, 0, 0);
    }
  }, [pushUndo, generateSand]);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'zen-garden.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width) || 600;
    const h = Math.round(Math.min(w * 0.6, 480));

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    generateSand(ctx, w, h);

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    off.getContext('2d').drawImage(canvas, 0, 0);
    sandCanvasRef.current = off;

    undoStackRef.current = [];
  }, [generateSand]);

  // Attach pointer/touch event handlers (stable via refs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width;
      const sy = canvas.height / r.height;
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - r.left) * sx,
          y: (e.touches[0].clientY - r.top) * sy,
        };
      }
      return {
        x: (e.clientX - r.left) * sx,
        y: (e.clientY - r.top) * sy,
      };
    }

    function rakeSegment(from, to, tines, spacing) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return;

      const px = -dy / len;
      const py = dx / len;
      const hw = ((tines - 1) * spacing) / 2;

      ctx.save();
      ctx.lineCap = 'round';

      for (let i = 0; i < tines; i++) {
        const off = -hw + i * spacing;
        const x1 = from.x + px * off;
        const y1 = from.y + py * off;
        const x2 = to.x + px * off;
        const y2 = to.y + py * off;

        // Groove shadow
        ctx.strokeStyle = 'rgba(155, 140, 115, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Ridge highlight
        ctx.strokeStyle = 'rgba(240, 232, 215, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1 + px * 1.5, y1 + py * 1.5);
        ctx.lineTo(x2 + px * 1.5, y2 + py * 1.5);
        ctx.stroke();
      }

      ctx.restore();
    }

    function smoothAt(pt, radius) {
      if (!sandCanvasRef.current) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.4;
      ctx.drawImage(sandCanvasRef.current, 0, 0);
      ctx.restore();
    }

    function placeStone(x, y, colorIdx) {
      const colors = STONE_PRESETS[colorIdx % STONE_PRESETS.length];
      const sz = 12 + Math.random() * 14;
      const ar = 0.7 + Math.random() * 0.25;
      const rot = Math.random() * Math.PI;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(2, 3, sz, sz * ar, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const g = ctx.createRadialGradient(
        -sz * 0.25,
        -sz * ar * 0.25,
        1,
        0,
        0,
        sz
      );
      g.addColorStop(0, colors.light);
      g.addColorStop(0.6, colors.base);
      g.addColorStop(1, colors.dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz * ar, 0, 0, Math.PI * 2);
      ctx.fill();

      // Edge
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    function circlePattern(x, y) {
      const rings = 4 + Math.floor(Math.random() * 3);
      const baseR = 18;
      const gap = 10;

      ctx.save();
      ctx.lineCap = 'round';

      for (let r = 0; r < rings; r++) {
        const radius = baseR + r * gap;

        ctx.strokeStyle = 'rgba(155, 140, 115, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(240, 232, 215, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    function onStart(e) {
      e.preventDefault();
      const pos = getPos(e);
      drawingRef.current = true;
      lastPointRef.current = pos;
      pushUndo();

      const t = toolRef.current;
      if (t === 'stone') {
        placeStone(pos.x, pos.y, stoneColorRef.current);
        drawingRef.current = false;
      } else if (t === 'circle') {
        circlePattern(pos.x, pos.y);
        drawingRef.current = false;
      }
    }

    function onMove(e) {
      e.preventDefault();
      if (!drawingRef.current || !lastPointRef.current) return;
      const pos = getPos(e);
      const t = toolRef.current;

      if (t === 'rake') {
        rakeSegment(lastPointRef.current, pos, rakeWidthRef.current, 6);
      } else if (t === 'smooth') {
        smoothAt(pos, 20);
      }

      lastPointRef.current = pos;
    }

    function onEnd(e) {
      if (e) e.preventDefault();
      drawingRef.current = false;
      lastPointRef.current = null;
    }

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);
    canvas.addEventListener('touchcancel', onEnd);

    return () => {
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
      canvas.removeEventListener('touchcancel', onEnd);
    };
  }, [pushUndo]);

  return { canvasRef, undo, reset, save };
}
