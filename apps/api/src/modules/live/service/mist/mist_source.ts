import {
  buildMistSourceForMode,
  type SourceOptionInput,
} from '../encoding/source-options';

/**
 * توافق مؤقت — المنطق الفعلي في
 * encoding/source-options/passthrough
 */
export function resolveMistSource(input: SourceOptionInput): string {
  return buildMistSourceForMode('passthrough', input);
}
