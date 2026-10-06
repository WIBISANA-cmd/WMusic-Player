import { z } from 'zod';

export interface LyricsLine {
  id: string;
  timeMs: number; // Milliseconds timestamp
  timeText: string; // e.g. "01:23.45"
  text: string;
  translation?: string;
}

export interface LyricsData {
  trackId: string;
  isSynced: boolean;
  lines: LyricsLine[];
  plainText?: string;
  provider?: string;
  offsetMs?: number;
}

export const LyricsLineSchema = z.object({
  id: z.string(),
  timeMs: z.number().nonnegative(),
  timeText: z.string(),
  text: z.string(),
  translation: z.string().optional()
});

export const LyricsDataSchema = z.object({
  trackId: z.string(),
  isSynced: z.boolean(),
  lines: z.array(LyricsLineSchema),
  plainText: z.string().optional(),
  provider: z.string().optional(),
  offsetMs: z.number().optional()
});

/**
 * Robust LRC Parser utility.
 * Supports standard format [mm:ss.xx] or [mm:ss:xx] or [mm:ss.xxx].
 */
export function parseLrcLyrics(lrcContent: string, trackId: string = ''): LyricsData {
  const lines: LyricsLine[] = [];
  const rawLines = lrcContent.split(/\r?\n/);
  const timeRegex = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
  let hasTimestamp = false;
  let offset = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) continue;

    // Check for offset tag e.g. [offset:+500]
    const offsetMatch = rawLine.match(/\[offset:\s*([+-]?\d+)\]/i);
    if (offsetMatch) {
      offset = parseInt(offsetMatch[1], 10) || 0;
      continue;
    }

    // Check metadata tags like [ar:artist]
    if (/^\[[a-zA-Z]+:[^\]]*\]$/.test(rawLine)) {
      continue;
    }

    // Match all timestamps on the line (multiple timestamps possible per lyric line)
    let match: RegExpExecArray | null;
    const timestamps: { timeMs: number; timeText: string }[] = [];
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(rawLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      const fractionMs = fracStr.length === 2 ? parseInt(fracStr, 10) * 10 : parseInt(fracStr, 10);
      const timeMs = minutes * 60 * 1000 + seconds * 1000 + fractionMs;
      timestamps.push({ timeMs, timeText: `${match[1]}:${match[2]}.${fracStr}` });
    }

    const textOnly = rawLine.replace(/\[\d{2}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();

    if (timestamps.length > 0) {
      hasTimestamp = true;
      for (const ts of timestamps) {
        lines.push({
          id: `line-${i}-${ts.timeMs}`,
          timeMs: Math.max(0, ts.timeMs + offset),
          timeText: ts.timeText,
          text: textOnly || '♪'
        });
      }
    } else if (textOnly) {
      lines.push({
        id: `line-${i}`,
        timeMs: 0,
        timeText: '00:00.00',
        text: textOnly
      });
    }
  }

  // Sort lines by timestamp
  lines.sort((a, b) => a.timeMs - b.timeMs);

  return {
    trackId,
    isSynced: hasTimestamp,
    lines,
    plainText: lines.map((l) => l.text).join('\n'),
    offsetMs: offset
  };
}
