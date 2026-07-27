import React from 'react';
import { Sparkles, X, Wallet, GraduationCap, Package, ArrowRight } from 'lucide-react';
import { Template } from '../types';
import { TEMPLATES } from '../utils/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet':
        return <Wallet className="w-6 h-6 text-emerald-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-indigo-400" />;
      case 'Package':
        return <Package className="w-6 h-6 text-amber-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Preset Spreadsheets</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-0.5">Template Gallery</h2>
            <p className="text-xs text-slate-400 mt-1">
              Start instantly with pre-formatted spreadsheets and formula calculations.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/50 p-4 rounded-xl transition cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="p-2 bg-slate-900 rounded-lg w-fit border border-slate-800 group-hover:scale-105 transition-transform">
                  {renderIcon(tmpl.icon)}
                </div>
                <h3 className="font-semibold text-slate-200 group-hover:text-emerald-300 text-sm">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Load Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
