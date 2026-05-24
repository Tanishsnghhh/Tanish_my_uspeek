// Type definitions for whisper-node
declare module 'whisper-node' {
  interface WhisperOptions {
    modelName?: string;
    whisperOptions?: {
      language?: string;
      word_timestamps?: boolean;
      verbose?: boolean;
      task?: string;
    };
  }

  interface WhisperResult {
    text?: string;
    transcript?: string;
    language?: string;  // Added language property
    segments?: Array<{
      start: number;
      end: number;
      text: string;
    }>;
    words?: Array<{
      word: string;
      text?: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  }

  function whisper(filePath: string, options?: WhisperOptions): Promise<WhisperResult | string>;
  export default whisper;
}
