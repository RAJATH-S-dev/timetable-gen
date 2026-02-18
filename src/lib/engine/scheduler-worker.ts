// scheduler.worker.ts
import { generateTimetable, SchedulerInput } from './wasm-loader';

// Listen for the "START_GENERATION" message from the main thread
self.onmessage = async (event: MessageEvent<SchedulerInput>) => {
  try {
    const result = await generateTimetable(event.data);
    // Send the result back to the main thread
    self.postMessage({ type: 'SUCCESS', payload: result });
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown engine error' 
    });
  }
};