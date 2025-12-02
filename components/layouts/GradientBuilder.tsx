"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";

interface GradientColor {
  color: string;
  stop: number; // 0-100
}

interface GradientBuilderProps {
  value: string; // CSS gradient string
  onChange: (gradient: string) => void;
}

export function GradientBuilder({ value, onChange }: GradientBuilderProps) {
  const [direction, setDirection] = useState<number>(135); // degrees
  const [colors, setColors] = useState<GradientColor[]>([
    { color: '#667eea', stop: 0 },
    { color: '#764ba2', stop: 100 },
  ]);

  // Parse existing gradient value when value prop changes (but not from our own updates)
  useEffect(() => {
    if (value && value.includes('gradient')) {
      try {
        // Parse linear-gradient(direction, color1 stop1%, color2 stop2%, ...)
        const match = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
        if (match) {
          const parsedDirection = parseInt(match[1]);
          const currentGradient = generateGradient();
          
          // Only update if the value is different from what we currently have
          // This prevents infinite loops when onChange updates the parent
          if (currentGradient !== value) {
            setDirection(parsedDirection);
            
            const colorStops = match[2].split(',').map((stop, index, array) => {
              const parts = stop.trim().split(/\s+/);
              const color = parts[0];
              const stopValue = parts[1] ? parseInt(parts[1].replace('%', '')) : (index === array.length - 1 ? 100 : (index * 100 / (array.length - 1)));
              return { color, stop: stopValue };
            });
            
            if (colorStops.length > 0) {
              setColors(colorStops);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing gradient:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Parse when value prop changes externally

  // Generate gradient CSS string
  const generateGradient = useCallback(() => {
    const sortedColors = [...colors].sort((a, b) => a.stop - b.stop);
    const colorStops = sortedColors.map(c => `${c.color} ${c.stop}%`).join(', ');
    return `linear-gradient(${direction}deg, ${colorStops})`;
  }, [direction, colors]);

  // Update parent when gradient changes
  useEffect(() => {
    const gradient = generateGradient();
    onChange(gradient);
  }, [generateGradient, onChange]);

  const addColor = () => {
    const newStop = colors.length > 0 ? Math.min(100, colors[colors.length - 1].stop + 10) : 50;
    setColors([...colors, { color: '#000000', stop: newStop }]);
  };

  const removeColor = (index: number) => {
    if (colors.length > 2) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index].color = color;
    setColors(newColors);
  };

  const updateStop = (index: number, stop: number) => {
    const newColors = [...colors];
    newColors[index].stop = Math.max(0, Math.min(100, stop));
    setColors(newColors);
  };

  const gradientPreview = generateGradient();

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gradient Preview
        </label>
        <div
          className="w-full h-32 rounded-lg border-2 border-gray-300 shadow-inner"
          style={{ background: gradientPreview }}
        />
        <p className="text-xs text-gray-500 mt-1 font-mono break-all">
          {gradientPreview}
        </p>
      </div>

      {/* Direction */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direction: {direction}°
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="360"
            value={direction}
            onChange={(e) => setDirection(parseInt(e.target.value))}
            className="flex-1"
          />
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full border-2 border-gray-300"
              style={{
                background: `conic-gradient(from ${direction}deg, #667eea, #764ba2, #667eea)`,
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${direction}deg)`,
              }}
            >
              <div className="w-1 h-4 bg-white rounded-full" />
            </div>
          </div>
          <input
            type="number"
            min="0"
            max="360"
            value={direction}
            onChange={(e) => setDirection(Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Color Stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Color Stops
          </label>
          <button
            type="button"
            onClick={addColor}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Color
          </button>
        </div>
        <div className="space-y-3">
          {colors.map((colorStop, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={colorStop.color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={colorStop.color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  placeholder="#667eea"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-32">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colorStop.stop}
                  onChange={(e) => updateStop(index, parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={colorStop.stop}
                  onChange={(e) => updateStop(index, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
              {colors.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preset Gradients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preset Gradients
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: 'Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { name: 'Blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { name: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { name: 'Ocean', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { name: 'Forest', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { name: 'Fire', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
            { name: 'Cool', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
            { name: 'Warm', gradient: 'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)' },
          ].map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                // Parse preset gradient
                const match = preset.gradient.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
                if (match) {
                  setDirection(parseInt(match[1]));
                  const colorStops = match[2].split(',').map((stop, i, arr) => {
                    const parts = stop.trim().split(/\s+/);
                    const color = parts[0];
                    const stopValue = parts[1] ? parseInt(parts[1].replace('%', '')) : (i === arr.length - 1 ? 100 : (i * 100 / (arr.length - 1)));
                    return { color, stop: stopValue };
                  });
                  setColors(colorStops);
                }
              }}
              className="h-12 rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors relative group"
              style={{ background: preset.gradient }}
              title={preset.name}
            >
              <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity text-white text-xs font-medium">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

