// src/hooks/use-scheduler-engine.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { SchedulerInput, SchedulerOutput } from '@/lib/engine/wasm-loader';

export function useSchedulerEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<SchedulerOutput | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(
      new URL('../lib/engine/scheduler.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'SUCCESS') {
        setOutput(event.data.payload);
      } else {
        console.error('Engine Error:', event.data.error);
      }
      setIsGenerating(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const runSolver = useCallback((input: SchedulerInput) => {
    setIsGenerating(true);
    workerRef.current?.postMessage(input);
  }, []);

  return { runSolver, isGenerating, output };
}