import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  PaintBucket,
  DollarSign,
  Percent,
  Paintbrush,
  Eraser,
  Type,
  Baseline
} from 'lucide-react';
import { Alignment, CellFormatting, NumberFormat } from '../types';

interface ToolbarProps {
  formatting: CellFormatting;
  onUpdateFormatting: (updates: Partial<CellFormatting>) => void;
  onClearFormatting: () => void;
  onCopyFormat: () => void;
  onPasteFormat: () => void;
  hasCopiedFormat: boolean;
}

const PRESET_TEXT_COLORS = [
  '#000000', '#1f2937', '#4b5563', '#9ca3af',
  '#dc2626', '#ea580c', '#d97706', '#059669',
  '#2563eb', '#7c3aed', '#db2777', '#0284c7'
];

const PRESET_BG_COLORS = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#fee2e2', '#ffedd5', '#fef3c7', '#d1fae5',
  '#dbeafe', '#ede9fe', '#fce7f3', '#e0f2fe'
];

export const Toolbar: React.FC<ToolbarProps> = ({
  formatting,
  onUpdateFormatting,
  onClearFormatting,
  onCopyFormat,
  onPasteFormat,
  hasCopiedFormat
}) => {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  return (
    <div className="bg-white text-slate-800 border-b border-slate-200 px-3 h-[44px] flex items-center gap-2 text-xs overflow-x-auto select-none shrink-0">
      {/* Format Painter / Clear */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2.5">
        <button
          onClick={onCopyFormat}
          className="p-1 rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Copy Cell Formatting (Format Painter)"
        >
          <Paintbrush className="w-3.5 h-3.5 text-slate-600" />
        </button>
        <button
          onClick={onPasteFormat}
          disabled={!hasCopiedFormat}
          className={`p-1 rounded transition ${
            hasCopiedFormat
              ? 'hover:bg-slate-100 text-blue-600 cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Paste Cell Formatting"
        >
          <PaintBucket className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClearFormatting}
          className="p-1 rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Clear Cell Formatting"
        >
          <Eraser className="w-3.5 h-3.5 text-rose-500" />
        </button>
      </div>

      {/* Font Family & Size */}
      <div className="flex items-center gap-1 border-r border-slate-200 pr-2.5">
        <select
          value={formatting.fontFamily || 'sans'}
          onChange={(e) => onUpdateFormatting({ fontFamily: e.target.value })}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
        >
          <option value="sans">Sans-Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>

        <select
          value={formatting.fontSize || 12}
          onChange={(e) => onUpdateFormatting({ fontSize: parseInt(e.target.value, 10) })}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
        >
          {[10, 11, 12, 13, 14, 16, 18, 20, 24].map((size) => (
            <option key={size} value={size}>
              {size}pt
            </option>
          ))}
        </select>
      </div>

      {/* Font Styling Buttons (B, I, U, S) */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2.5">
        <button
          onClick={() => onUpdateFormatting({ bold: !formatting.bold })}
          className={`p-1 px-1.5 rounded text-xs transition cursor-pointer font-bold ${
            formatting.bold ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        <button
          onClick={() => onUpdateFormatting({ italic: !formatting.italic })}
          className={`p-1 px-1.5 rounded text-xs transition cursor-pointer italic font-serif ${
            formatting.italic ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        <button
          onClick={() => onUpdateFormatting({ underline: !formatting.underline })}
          className={`p-1 px-1.5 rounded text-xs transition cursor-pointer underline ${
            formatting.underline ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Underline (Ctrl+U)"
        >
          U
        </button>

        <button
          onClick={() => onUpdateFormatting({ strikethrough: !formatting.strikethrough })}
          className={`p-1 px-1.5 rounded text-xs transition cursor-pointer line-through ${
            formatting.strikethrough ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Text & Background Color Pickers */}
      <div className="flex items-center gap-1 border-r border-slate-200 pr-2.5 relative">
        {/* Text Color */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTextColorPicker(!showTextColorPicker);
              setShowBgColorPicker(false);
            }}
            className="flex items-center gap-1 p-1 hover:bg-slate-100 rounded cursor-pointer"
            title="Text Color"
          >
            <Baseline className="w-3.5 h-3.5" style={{ color: formatting.color || '#1e293b' }} />
            <div
              className="w-2.5 h-1 rounded-xs"
              style={{ backgroundColor: formatting.color || '#1e293b' }}
            />
          </button>

          {showTextColorPicker && (
            <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-md p-2 shadow-lg grid grid-cols-4 gap-1.5 w-36 text-slate-800">
              <div className="col-span-4 text-[10px] text-slate-500 font-semibold mb-1">TEXT COLOR</div>
              {PRESET_TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onUpdateFormatting({ color: c });
                    setShowTextColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-slate-200 hover:scale-105 transition cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="col-span-4 mt-1 border-t border-slate-100 pt-1">
                <input
                  type="color"
                  value={formatting.color || '#000000'}
                  onChange={(e) => {
                    onUpdateFormatting({ color: e.target.value });
                    setShowTextColorPicker(false);
                  }}
                  className="w-full h-5 cursor-pointer rounded bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fill Background Color */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBgColorPicker(!showBgColorPicker);
              setShowTextColorPicker(false);
            }}
            className="flex items-center gap-1 p-1 hover:bg-slate-100 rounded cursor-pointer"
            title="Fill Background Color"
          >
            <Palette className="w-3.5 h-3.5 text-slate-600" />
            <div
              className="w-2.5 h-1 rounded-xs border border-slate-300"
              style={{ backgroundColor: formatting.bg || 'transparent' }}
            />
          </button>

          {showBgColorPicker && (
            <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-md p-2 shadow-lg grid grid-cols-4 gap-1.5 w-36 text-slate-800">
              <div className="col-span-4 text-[10px] text-slate-500 font-semibold mb-1">BACKGROUND COLOR</div>
              <button
                onClick={() => {
                  onUpdateFormatting({ bg: undefined });
                  setShowBgColorPicker(false);
                }}
                className="col-span-4 text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 py-0.5 rounded border border-slate-200 mb-1"
              >
                No Fill (Transparent)
              </button>
              {PRESET_BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onUpdateFormatting({ bg: c });
                    setShowBgColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-slate-200 hover:scale-105 transition cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="col-span-4 mt-1 border-t border-slate-100 pt-1">
                <input
                  type="color"
                  value={formatting.bg || '#ffffff'}
                  onChange={(e) => {
                    onUpdateFormatting({ bg: e.target.value });
                    setShowBgColorPicker(false);
                  }}
                  className="w-full h-5 cursor-pointer rounded bg-transparent"
                  title="Custom background color"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alignment Buttons */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2.5">
        {(['left', 'center', 'right'] as Alignment[]).map((align) => (
          <button
            key={align}
            onClick={() => onUpdateFormatting({ align })}
            className={`p-1 rounded transition cursor-pointer ${
              (formatting.align || 'left') === align
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
          >
            {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
            {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
            {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>

      {/* Number Formatting & Quick Formulas */}
      <div className="flex items-center gap-1">
        <select
          value={formatting.format || 'general'}
          onChange={(e) => onUpdateFormatting({ format: e.target.value as NumberFormat })}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
        >
          <option value="general">General</option>
          <option value="number">Number (1,234.56)</option>
          <option value="currency">Currency ($1,234.56)</option>
          <option value="percent">Percentage (12.34%)</option>
          <option value="text">Plain Text</option>
        </select>

        <button
          onClick={() => onUpdateFormatting({ format: 'currency' })}
          className={`p-1 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer font-medium ${
            formatting.format === 'currency' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-700'
          }`}
          title="Format as Currency ($)"
        >
          <DollarSign className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onUpdateFormatting({ format: 'percent' })}
          className={`p-1 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer font-medium ${
            formatting.format === 'percent' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-700'
          }`}
          title="Format as Percent (%)"
        >
          <Percent className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
