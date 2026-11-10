import React from 'react';
import { AlertCircle, PlusCircle, Save, X } from 'lucide-react';

interface ConfirmNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndCreateNew: () => void;
  onDiscardAndCreateNew: () => void;
}

export const ConfirmNewProjectModal: React.FC<ConfirmNewProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveAndCreateNew,
  onDiscardAndCreateNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cambios sin Guardar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El proyecto actual contiene modificaciones no guardadas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Si continúas sin guardar, se perderán las tablas, relaciones y pasos creados en este proyecto. ¿Qué deseas hacer?
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onSaveAndCreateNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Proyecto y Crear Nuevo</span>
            </button>

            <button
              type="button"
              onClick={onDiscardAndCreateNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <span>Descartar Cambios y Comenzar Nuevo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-center transition-colors"
            >
              Cancelar y Seguir en este Proyecto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
