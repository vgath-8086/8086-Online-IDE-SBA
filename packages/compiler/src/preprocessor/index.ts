import { MacroExpander } from './macro-expander.js';
import { PreProcessor }  from './preprocessor.js';
import type { IPreProcessor } from '../interfaces/i-preprocessor.js';

export function createPreprocessor(): IPreProcessor {
  return new PreProcessor(new MacroExpander());
}

export { PreProcessor } from './preprocessor.js';
