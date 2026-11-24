import { detectFileType, type DetectedType } from './detect';
import { formatBytes } from './format';

export interface ValidatedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: DetectedType;
}

export interface ValidationOptions {
  maxBytes: number;
  accept: DetectedType[];
  /** Human-readable list for error messages, e.g. "JPG, PNG or WebP" */
  acceptLabel: string;
}

export class FileValidationError extends Error {
  constructor(
    message: string,
    public fileName: string,
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

let counter = 0;
export const newId = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function validateFile(file: File, opts: ValidationOptions): Promise<ValidatedFile> {
  if (file.size === 0) throw new FileValidationError(`“${file.name}” is empty.`, file.name);
  if (file.size > opts.maxBytes) {
    throw new FileValidationError(
      `“${file.name}” is ${formatBytes(file.size)}, which exceeds the ${formatBytes(opts.maxBytes)} limit.`,
      file.name,
    );
  }
  const type = await detectFileType(file);
  if (!opts.accept.includes(type)) {
    throw new FileValidationError(
      `“${file.name}” is not a supported file. Expected ${opts.acceptLabel}${type !== 'unknown' && type !== 'text/plain' ? ` (detected ${type})` : ''}.`,
      file.name,
    );
  }
  return { id: newId(), file, name: file.name, size: file.size, type };
}
