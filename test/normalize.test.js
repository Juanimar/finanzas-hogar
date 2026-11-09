import { describe, it, expect } from 'vitest';
import { normalizeComercio, tokens } from '../src/core/normalize.js';

describe('normalizeComercio', () => {
  it.each([
    ['MERPAGO*MACROMERCADO MONTE', 'MACROMERCADO'],
    ['DLO*PedidosYa Envio VIS3', 'PEDIDOSYA ENVIO'],
    ['DEVOTO EXPRESS VIS3', 'DEVOTO EXPRESS'],
    ['ANTHROPIC* CLAUDE SUB +1415', 'ANTHROPIC CLAUDE SUB'],
    ['DLO*UBER*RIDES MONTE', 'UBER RIDES'],
    ['Café  Ñandú', 'CAFE NANDU'],
    ['MERPAGO*MERCADOLIBRE MONTE', 'MERCADOLIBRE'],
    ['', ''],
  ])('%s → %s', (raw, out) => expect(normalizeComercio(raw)).toBe(out));
});

describe('tokens', () => {
  it('drops generic words', () => {
    expect(tokens('PEDIDOSYA ENVIO')).toEqual(['PEDIDOSYA']);
    expect(tokens('DEVOTO EXPRESS')).toEqual(['DEVOTO', 'EXPRESS']);
  });
});
