'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { Assumptions, ModelOutput } from '@/lib/financial-types';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';
import { runModel } from '@/lib/model';

interface ModelContextValue {
  assumptions: Assumptions;
  setAssumptions: (a: Assumptions) => void;
  updateAssumption: <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => void;
  model: ModelOutput;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);

  const model = useMemo(() => runModel(assumptions), [assumptions]);

  const updateAssumption = <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ModelContext.Provider value={{ assumptions, setAssumptions, updateAssumption, model }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}
