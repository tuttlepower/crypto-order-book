"use client";

import { useEffect, useRef } from "react";
import { useQuoteStore, EMPTY_QUOTES } from "@/store/quote-store";
import { useConfigStore } from "@/store/config-store";
import { getSpreadForSymbol } from "@/lib/aggregator";

interface SpreadPoint {
  time: number;
  spreadBps: number;
}

const MAX_POINTS = 200;

export function SpreadChart() {
  const selectedSymbol = useConfigStore((s) => s.selectedSymbol);
  const quotesForSymbol = useQuoteStore((s) => s.quotes[selectedSymbol] ?? EMPTY_QUOTES);
  const maxAgeSec = useConfigStore((s) => s.config.settings.maxQuoteAgeSec);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<SpreadPoint[]>([]);

  // Record spread data points
  useEffect(() => {
    const spread = getSpreadForSymbol(quotesForSymbol, maxAgeSec);
    if (spread) {
      dataRef.current.push({ time: Date.now(), spreadBps: spread.spreadBps });
      if (dataRef.current.length > MAX_POINTS) {
        dataRef.current = dataRef.current.slice(-MAX_POINTS);
      }
    }
  }, [quotesForSymbol, maxAgeSec]);

  // Draw chart
  useEffect(() => {
    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const data = dataRef.current;
      const { width, height } = canvas;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      if (data.length < 2) {
        ctx.fillStyle = "#a3a3a3";
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Collecting spread data...", w / 2, h / 2);
        return;
      }

      const values = data.map((d) => d.spreadBps);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      const padding = 40;

      // Draw grid lines
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + ((h - padding * 2) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();

        const val = max - (range * i) / 4;
        ctx.fillStyle = "#a3a3a3";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(val.toFixed(1), padding - 4, y + 3);
      }

      // Draw spread line
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < data.length; i++) {
        const x = padding + ((w - padding - 10) * i) / (data.length - 1);
        const y = padding + ((max - data[i].spreadBps) / range) * (h - padding * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "10px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("Spread (bps)", padding, 12);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
        Spread History — {selectedSymbol}
      </h3>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 200 }}
      />
    </div>
  );
}
