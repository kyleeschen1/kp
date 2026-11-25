import { identity, messageLimit, record, text, type ChatMessage } from '../../src/editor-chat/protocol.ts';

const nativeLimit = 16 * 1024 * 1024;
const optionalText = (value: unknown) => value === null || value === undefined ? '' : text(value, nativeLimit);
function content(value: unknown): string {
  if (typeof value === 'string') return text(value, nativeLimit);
  if (!Array.isArray(value)) return '';
  return value.map(raw => {
    const part = record(raw);
    return ['text', 'inputText', 'input_text', 'output_text'].includes(String(part['type'])) ? optionalText(part['text']) : '[Non-text content]';
  }).join('\n');
}

/** Project native app-server items into bounded display records. This adapter
 * cannot request a tool or turn; reconnect rebuilds it from native history. */
export function nativeMessage(value: unknown, complete: boolean, turnId?: string): ChatMessage | null {
  const item = record(value);
  let author: { role: 'user' | 'assistant' } | { role: 'tool'; tool: string }, body: string;
  switch (item['type']) {
    case 'agentMessage': author = { role: 'assistant' }; body = text(item['text'], nativeLimit); break;
    case 'userMessage': author = { role: 'user' }; body = content(item['content']); break;
    case 'commandExecution':
      author = { role: 'tool', tool: 'Command' };
      body = '$ ' + optionalText(item['command']) + '\n' + optionalText(item['aggregatedOutput']); break;
    case 'functionCallOutput':
      author = { role: 'tool', tool: [optionalText(item['namespace']), optionalText(item['name'])].filter(Boolean).join('.') || 'Function' };
      body = content(item['output']); break;
    case 'mcpToolCall': {
      author = { role: 'tool', tool: optionalText(item['server']) + '.' + optionalText(item['tool']) };
      const result = item['result'] ? record(item['result']) : null, error = item['error'] ? record(item['error']) : null;
      body = error ? optionalText(error['message']) : result ? content(result['content']) || JSON.stringify(result['structuredContent'] ?? '') : '';
      break;
    }
    case 'dynamicToolCall':
      author = { role: 'tool', tool: [optionalText(item['namespace']), optionalText(item['tool'])].filter(Boolean).join('.') || 'Tool' };
      body = content(item['contentItems']); break;
    case 'fileChange':
      author = { role: 'tool', tool: 'File changes' };
      body = Array.isArray(item['changes']) ? item['changes'].map(raw => {
        const change = record(raw); return optionalText(change['path']) + '\n' + optionalText(change['diff']);
      }).join('\n\n') : ''; break;
    default: return null;
  }
  if (author.role === 'tool') author.tool = author.tool.slice(0, 300);
  return { id: identity(item['id']), ...author, text: body.slice(0, messageLimit), complete,
    clipped: body.length > messageLimit, ...(turnId ? { turnId } : {}) };
}
