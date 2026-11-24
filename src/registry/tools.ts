import type { ImplementationKey, ToolDefinition } from '../types/tool';
import { IMAGE_TOOLS } from './data/image';
import { PDF_TOOLS } from './data/pdf';
import { TEXT_TOOLS } from './data/text';
import { DEVELOPER_TOOLS } from './data/developer';
import { CALCULATOR_TOOLS, CONVERTER_TOOLS, PRODUCTIVITY_TOOLS, SECURITY_TOOLS } from './data/misc';

/**
 * Central, typed tool registry. This is the single source of truth for which
 * processing implementations exist. The database may override metadata
 * (title, description, SEO, status) but never adds executable logic.
 */
export const TOOLS: ToolDefinition[] = [
  ...IMAGE_TOOLS,
  ...PDF_TOOLS,
  ...TEXT_TOOLS,
  ...DEVELOPER_TOOLS,
  ...CONVERTER_TOOLS,
  ...CALCULATOR_TOOLS,
  ...PRODUCTIVITY_TOOLS,
  ...SECURITY_TOOLS,
];

const byKey = new Map<string, ToolDefinition>(TOOLS.map((t) => [t.implementation, t]));

export function getToolDefinition(key: ImplementationKey | string): ToolDefinition | undefined {
  return byKey.get(key);
}
