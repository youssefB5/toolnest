import type { UiKey } from '../../i18n';

/** Common UI strings passed to tool islands (tool-specific labels are in English). */
export const UI_KEYS_FOR_TOOLS = [
  'ui.selectFiles',
  'ui.selectFile',
  'ui.dropHere',
  'ui.maxSize',
  'ui.remove',
  'ui.reset',
  'ui.download',
  'ui.downloadAll',
  'ui.copy',
  'ui.copied',
  'ui.processing',
  'ui.result',
  'ui.input',
  'ui.output',
  'ui.error',
  'ui.original',
  'ui.options',
  'tool.loading',
] as const satisfies readonly UiKey[];

export type ToolUi = Record<(typeof UI_KEYS_FOR_TOOLS)[number], string>;
