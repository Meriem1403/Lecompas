import { useEffect, useRef, type PointerEvent } from "react";
import { Button } from "../ui/button";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const loaded = useRef("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const paint = () => {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineWidth = 2.2;
      context.lineCap = "round";
      context.strokeStyle = "#1e3a8a";
    };
    if (canvas.width === 0 || Math.abs(canvas.width - rect.width * ratio) > 2) {
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      loaded.current = "";
    }
    paint();
    if (!value || value === loaded.current) return;
    loaded.current = value;
    const image = new Image();
    image.onload = () => {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.drawImage(image, 0, 0, rect.width, rect.height);
      paint();
    };
    image.src = value;
  }, [value]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const cursor = point(event);
    context.beginPath();
    context.moveTo(cursor.x, cursor.y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const cursor = point(event);
    context.lineTo(cursor.x, cursor.y);
    context.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    loaded.current = url;
    onChange(url);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    loaded.current = "";
    onChange("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-xl border-2 border-dashed border-sky-300 bg-white"
        aria-label="Pad de signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="outline" className="border-sky-200" onClick={clear}>
        Effacer la signature
      </Button>
    </div>
  );
}
