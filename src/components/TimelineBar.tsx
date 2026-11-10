import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  History, 
  ChevronUp, 
  ChevronDown,
  FileCode,
  CheckCircle2,
  GitBranch,
  Layers
} from 'lucide-react';
import { SchemaStep } from '../types/erd';
import { generateCommandSql } from '../utils/exportSql';

interface TimelineBarProps {
  steps: SchemaStep[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onOpenAddStep: () => void;
  onOpenMigrationsSql: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  steps,
  activeStepIndex,
  onSelectStep,
  onOpenAddStep,
  onOpenMigrationsSql,
  isOpen,
  onToggleOpen,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation through timeline
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        if (activeStepIndex >= steps.length - 1) {
          setIsPlaying(false);
        } else {
          onSelectStep(activeStepIndex + 1);
        }
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, activeStepIndex, onSelectStep]);

  const currentStep = steps[activeStepIndex] || steps[0];

  if (!isOpen) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 select-none">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-amber-500 hover:text-amber-500 transition-all group"
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Línea de Tiempo: Paso {currentStep?.stepNumber ?? 0} ({currentStep?.version ?? 'V1.0'})</span>
          <ChevronUp className="w-3.5 h-3.5 opacity-60 group-hover:translate-y-[-2px] transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 w-[92%] max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 select-none flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-150">
      {/* Top Header of the Timeline Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Línea de Tiempo de Esquema y Migraciones
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeStepIndex + 1} de {steps.length} pasos
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Visualiza y reproduce cómo evoluciona la base de datos a lo largo del tiempo.
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMigrationsSql}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-500" />
            <span>Ver SQL Migraciones</span>
          </button>

          <button
            onClick={onOpenAddStep}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Nuevo Paso</span>
          </button>

          <button
            onClick={onToggleOpen}
            title="Minimizar línea de tiempo"
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubber & Steps Track */}
      <div className="relative px-2 py-1 flex items-center gap-3">
        {/* Play / Previous / Next Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => onSelectStep(Math.max(activeStepIndex - 1, 0))}
            disabled={activeStepIndex <= 0}
            title="Paso anterior"
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pausar reproducción" : "Reproducir evolución temporal"}
            className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onSelectStep(Math.min(activeStepIndex + 1, steps.length - 1))}
            disabled={activeStepIndex >= steps.length - 1}
            title="Siguiente paso"
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Nodes Chain */}
        <div className="flex-1 relative overflow-x-auto py-2">
          {/* Background Track Line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />

          {/* Progress Filled Line */}
          <div
            style={{
              width: `${(activeStepIndex / Math.max(steps.length - 1, 1)) * 100}%`,
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-amber-500 rounded-full transition-all duration-300"
          />

          {/* Step Bubbles */}
          <div className="relative flex items-center justify-between min-w-[320px] px-2">
            {steps.map((st, idx) => {
              const isActive = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStep(idx)}
                  className="flex flex-col items-center group relative focus:outline-none"
                >
                  {/* Step Bubble Circle */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-200 z-10 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-125 shadow-md'
                        : isPast
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500'
                    }`}
                  >
                    {st.stepNumber}
                  </div>

                  {/* Step Label underneath */}
                  <span
                    className={`mt-1.5 text-[11px] whitespace-nowrap font-medium transition-colors max-w-[100px] truncate ${
                      isActive
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {st.version}
                  </span>

                  {/* Hover tooltip with title */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <p className="font-semibold">{st.title}</p>
                    <p className="text-[9px] text-slate-400">{st.createdAt} · {st.commands.length} operaciones</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Step Details & Executed SQL Box */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentStep.title}
            </span>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              ({currentStep.createdAt})
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {currentStep.description || (
              currentStep.stepNumber === 0 
                ? 'Esquema base inicial: Creación de tablas principales y relaciones clave.'
                : `${currentStep.commands.length} alteración(es) aplicadas a la estructura de datos.`
            )}
          </p>
        </div>

        {/* SQL Command Preview */}
        {currentStep.commands.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 max-w-sm truncate shrink-0">
            {generateCommandSql(currentStep.commands[0], 'postgres')}
            {currentStep.commands.length > 1 && ` (+${currentStep.commands.length - 1} más)`}
          </div>
        )}
      </div>
    </div>
  );
};
