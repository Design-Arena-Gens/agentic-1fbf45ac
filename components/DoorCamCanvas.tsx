"use client";

import React, { useEffect, useRef } from "react";

export function DoorCamCanvas({
  canvasRef,
  width,
  height,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef && canvasRef.current) {
      internalRef.current = canvasRef.current;
    }
  }, [canvasRef]);

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let running = true;

    const world = createWorld(width, height);

    const loop = () => {
      if (!running) return;
      frame++;
      stepWorld(world, frame);
      drawWorld(ctx, world, frame);
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [width, height]);

  return <canvas ref={internalRef} />;
}

// ---------- Scene state ----------

type World = {
  timeStartMs: number;
  camNoiseSeed: number;
  dog: {
    x: number;
    y: number;
    headNod: number;
    tailWag: number;
  };
  burger: {
    x: number;
    y: number;
    radius: number;
  };
  door: {
    x: number;
    width: number;
  };
};

function createWorld(w: number, h: number): World {
  return {
    timeStartMs: performance.now(),
    camNoiseSeed: Math.random() * 1000,
    dog: {
      x: w * 0.55,
      y: h * 0.68,
      headNod: 0,
      tailWag: 0,
    },
    burger: {
      x: w * 0.64,
      y: h * 0.74,
      radius: Math.max(10, Math.min(w, h) * 0.035),
    },
    door: {
      x: w * 0.18,
      width: w * 0.16,
    },
  };
}

function stepWorld(world: World, frame: number) {
  // Dog animation: nod head towards burger, tail wag, subtle body sway
  const t = frame / 60;
  world.dog.headNod = Math.sin(t * 2.4) * 6 + easeInOutCubic(Math.sin(t * 0.6) * 0.5 + 0.5) * 6;
  world.dog.tailWag = Math.sin(t * 9) * 12;

  // Eating burger: reduce burger radius slightly when head is close
  const mouthX = world.dog.x + 72;
  const mouthY = world.dog.y - 28 + world.dog.headNod * 0.5;
  const dx = mouthX - world.burger.x;
  const dy = mouthY - world.burger.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 40 && world.burger.radius > 5) {
    world.burger.radius -= 0.08; // slow nibble
  }
}

// ---------- Drawing ----------

function drawWorld(ctx: CanvasRenderingContext2D, world: World, frame: number) {
  const { width: w, height: h } = ctx.canvas;

  // Background: dusk sky + ground
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#26323a");
  sky.addColorStop(1, "#101418");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#0c1012";
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Subtle camera shake
  const shake = perlin(world.camNoiseSeed, frame * 0.01) * 0.7;
  ctx.save();
  ctx.translate(shake, -shake);

  drawDoor(ctx, world);
  drawBurger(ctx, world);
  drawDog(ctx, world);

  ctx.restore();

  drawOverlay(ctx, world, frame);
}

function drawDoor(ctx: CanvasRenderingContext2D, world: World) {
  const { x, width } = world.door;
  const h = ctx.canvas.height;
  ctx.fillStyle = "#1a2024";
  ctx.fillRect(x - 6, h * 0.22 - 6, width + 12, h * 0.58 + 12);

  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, "#4a585f");
  grad.addColorStop(1, "#2b353a");
  ctx.fillStyle = grad;
  ctx.fillRect(x, h * 0.22, width, h * 0.58);

  // Door handle
  ctx.fillStyle = "#b5c3c9";
  ctx.fillRect(x + width - 16, h * 0.52, 6, 18);
}

function drawBurger(ctx: CanvasRenderingContext2D, world: World) {
  const { x, y, radius } = world.burger;
  // Plate shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + radius * 0.9, radius * 1.3, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bottom bun
  ctx.fillStyle = "#c78e49";
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 1.3, radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Patty
  ctx.fillStyle = "#5c3a27";
  ctx.fillRect(x - radius * 1.05, y - radius * 0.15, radius * 2.1, radius * 0.35);

  // Cheese
  ctx.fillStyle = "#ffd65a";
  ctx.fillRect(x - radius * 0.95, y - radius * 0.35, radius * 1.9, radius * 0.25);

  // Lettuce
  ctx.fillStyle = "#6ec36e";
  ctx.beginPath();
  ctx.moveTo(x - radius, y - radius * 0.35);
  for (let i = 0; i <= 10; i++) {
    const px = x - radius + (i / 10) * radius * 2;
    const py = y - radius * 0.45 + Math.sin(i * 0.9) * (radius * 0.08);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + radius, y - radius * 0.2);
  ctx.closePath();
  ctx.fill();

  // Top bun
  ctx.fillStyle = "#d69b54";
  ctx.beginPath();
  ctx.ellipse(x, y - radius * 0.35, radius * 1.2, radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sesame seeds
  ctx.fillStyle = "#f6ead2";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const sx = x + Math.cos(a) * radius * 0.6 * (0.6 + Math.random() * 0.2);
    const sy = y - radius * 0.35 + Math.sin(a) * radius * 0.2 * (0.4 + Math.random() * 0.2);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 2, 1.2, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDog(ctx: CanvasRenderingContext2D, world: World) {
  const baseX = world.dog.x;
  const baseY = world.dog.y;

  // Body
  ctx.fillStyle = "#a07e5a";
  ctx.beginPath();
  ctx.ellipse(baseX, baseY - 20, 110, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#8e6f50";
  ctx.fillRect(baseX - 60, baseY + 12, 16, 34);
  ctx.fillRect(baseX - 20, baseY + 14, 16, 34);
  ctx.fillRect(baseX + 12, baseY + 16, 16, 34);
  ctx.fillRect(baseX + 48, baseY + 18, 16, 34);

  // Tail (wag)
  ctx.save();
  ctx.translate(baseX - 110, baseY - 34);
  ctx.rotate((world.dog.tailWag * Math.PI) / 180);
  ctx.fillStyle = "#a07e5a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 46, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head with nod
  ctx.save();
  ctx.translate(baseX + 86, baseY - 48 + world.dog.headNod);
  ctx.fillStyle = "#a07e5a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = "#7a5c3f";
  ctx.beginPath();
  ctx.ellipse(-18, -18, 10, 18, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = "#8e6f50";
  ctx.beginPath();
  ctx.ellipse(24, 4, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = "#2b2f33";
  ctx.beginPath();
  ctx.arc(38, 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#1e2327";
  ctx.beginPath();
  ctx.arc(6, -6, 3, 0, Math.PI * 2);
  ctx.fill();

  // Tongue
  ctx.fillStyle = "#e57373";
  ctx.beginPath();
  ctx.ellipse(28, 12, 6, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, world: World, frame: number) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Desaturate / green tint
  ctx.fillStyle = "rgba(0, 20, 12, 0.18)";
  ctx.fillRect(0, 0, w, h);

  // Vignetting
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Scanlines
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
  ctx.globalCompositeOperation = "source-over";

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(10, 10, 160, 70);

  ctx.fillStyle = "#b5ffe7";
  ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("DOOR CAM 1", 20, 32);

  ctx.fillStyle = "#9ec6bd";
  ctx.fillText(nowString(world.timeStartMs, frame), 20, 56);

  // REC dot
  const blink = Math.sin(frame / 12) > 0;
  ctx.fillStyle = blink ? "#ff4d4f" : "#3a0f10";
  ctx.beginPath();
  ctx.arc(150, 28, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb3b3";
  ctx.fillText("REC", 140, 56);

  // Frame border
  ctx.strokeStyle = "rgba(181,255,231,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
}

// ---------- Utils ----------

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function nowString(start: number, frame: number): string {
  const t = start + (frame / 60) * 1000;
  const d = new Date(t);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  const SS = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

// Simple pseudo-perlin via sin waves blending
function perlin(seed: number, t: number): number {
  return (
    Math.sin(seed + t * 1.7) * 0.5 +
    Math.sin(seed * 1.3 + t * 0.97) * 0.3 +
    Math.sin(seed * 2.1 + t * 2.31) * 0.2
  );
}
