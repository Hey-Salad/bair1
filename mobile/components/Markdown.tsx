import { Fragment } from 'react';
import { Text } from 'heroui-native';

// Minimal inline markdown: **bold**, *italic*, `code`. Renders per-line.
type Token = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) tokens.push({ text: line.slice(last, match.index) });
    const seg = match[0];
    if (seg.startsWith('**')) tokens.push({ text: seg.slice(2, -2), bold: true });
    else if (seg.startsWith('`')) tokens.push({ text: seg.slice(1, -1), code: true });
    else tokens.push({ text: seg.slice(1, -1), italic: true });
    last = match.index + seg.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

export function Markdown({ content, color }: { content: string; color: string }) {
  const lines = content.split('\n');
  return (
    <Text className="text-sm leading-5" style={{ color }}>
      {lines.map((line, li) => {
        // Bullet list support
        const isBullet = /^\s*[-*]\s+/.test(line);
        const clean = isBullet ? line.replace(/^\s*[-*]\s+/, '') : line;
        const tokens = tokenize(clean);
        return (
          // eslint-disable-next-line react/no-array-index-key -- lines from string split have no natural id
          <Fragment key={`line-${li}`}>
            {isBullet ? '• ' : ''}
            {tokens.map((t, ti) => {
              // eslint-disable-next-line react/no-array-index-key -- inline tokens have no natural id
              const tokenKey = `${li}-${ti}`;
              return (
                <Text
                  key={tokenKey}
                  style={{
                    color,
                    fontWeight: t.bold ? '700' : '400',
                    fontStyle: t.italic ? 'italic' : 'normal',
                    fontFamily: t.code ? 'monospace' : undefined,
                    backgroundColor: t.code ? 'rgba(255,255,255,0.08)' : undefined,
                  }}
                >
                  {t.text}
                </Text>
              );
            })}
            {li < lines.length - 1 ? '\n' : ''}
          </Fragment>
        );
      })}
    </Text>
  );
}
