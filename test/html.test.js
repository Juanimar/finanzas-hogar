import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { htmlToText } from '../src/core/html.js';
import { parseItauEmail } from '../src/core/parsers.js';

const html = readFileSync(new URL('./fixtures/itau-debito.html', import.meta.url), 'utf8');

describe('htmlToText', () => {
  it('drops styles and tags, decodes entities, collapses spaces', () => {
    const t = htmlToText(html);
    expect(t).not.toMatch(/margin|@media|<|>/);
    expect(t).toContain('Realizado en DEVOTO EXPRESS VIS3 Monto: 832.71 Pesos.');
    expect(t).toContain('Itaú');
    expect(htmlToText('a&nbsp;b &amp; c &#233; &#xE9;')).toBe('a b & c é é');
  });
  it('the real HTML débito mail parses', () => {
    const r = parseItauEmail({ id: 'h1', subject: 'Aviso de consumo aprobado con tarjeta de débito', body: htmlToText(html), date: '2026-11-06T23:21:58Z' });
    expect(r.ok).toBe(true);
    expect(r.movs[0]).toMatchObject({ medio: 'Débito 2222', monto_orig: 832.71, moneda: 'UYU', comercio_raw: 'DEVOTO EXPRESS VIS3' });
  });
});
