import { newItem, type Item } from './types';

export type CsvResult = {
  items: Item[];
  errors: string[];
};

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(items: readonly Item[]): string {
  const rows = ['label,weight'];
  for (const item of items) {
    rows.push(`${escapeField(item.label)},${item.weight}`);
  }
  return rows.join('\r\n');
}

/** RFC4180-ish row splitter: handles quoted fields containing commas and newlines. */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"' && field === '') {
      quoted = true;
      i++;
      continue;
    }
    if (char === ',') {
      endField();
      i++;
      continue;
    }
    if (char === '\r') {
      // Swallow CRLF as a single terminator.
      if (text[i + 1] === '\n') i++;
      endRow();
      i++;
      continue;
    }
    if (char === '\n') {
      endRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }
  // Trailing field/row, unless the file ended cleanly on a newline.
  if (field !== '' || row.length > 0) endRow();
  return rows;
}

function isHeader(row: string[]): boolean {
  const first = (row[0] ?? '').trim().toLowerCase();
  return first === 'label' || first === 'name' || first === 'item';
}

export function fromCsv(text: string): CsvResult {
  // Excel and friends prepend a UTF-8 BOM, which would otherwise become part
  // of the first label (or hide the header).
  const clean = text.replace(/^﻿/, '');
  const rows = parseRows(clean);
  const items: Item[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    if (index === 0 && isHeader(row)) return;
    if (row.every((cell) => cell.trim() === '')) return;

    const label = (row[0] ?? '').trim();
    if (!label) {
      errors.push(`Line ${index + 1}: empty label, skipped.`);
      return;
    }

    const rawWeight = (row[1] ?? '').trim();
    let weight = 1;
    if (rawWeight !== '') {
      const parsed = Number(rawWeight);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push(`Line ${index + 1}: "${rawWeight}" is not a valid weight, used 1.`);
      } else {
        weight = parsed;
      }
    }
    items.push(newItem(label, weight));
  });

  return { items, errors };
}
