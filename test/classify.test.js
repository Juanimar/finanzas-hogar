import { describe, it, expect } from 'vitest';
import { classify, quienFor, applyToSimilar } from '../src/core/classify.js';

const reglas = [
  { tipo: 'contiene', patron: 'UBER', categoria: 'Transporte', descripcion: 'Uber' },
  { tipo: 'contiene', patron: 'UBER EATS', categoria: 'Delivery', descripcion: 'Uber Eats' },
  { tipo: 'exacta', patron: 'DEVOTO EXPRESS', categoria: 'Casa', descripcion: 'Devoto raro' },
  { tipo: 'contiene', patron: 'DEVOTO', categoria: 'Supermercado', descripcion: 'Devoto' },
  { tipo: 'exacta', patron: 'UTE', categoria: 'Servicios', descripcion: 'UTE' },
  { tipo: 'contiene', patron: 'MIDINERO', categoria: 'Servicio doméstico', descripcion: 'Midinero' },
];
const cuentas = [
  { numero: '1111', tipo: 'tarjeta_propia', titular: 'Compartido' },
  { numero: '5555', tipo: 'tarjeta_propia', titular: 'Mili' },
  { numero: '1234567', tipo: 'tercero', nombre: 'Peluquería', categoria: 'Estética/Cosmética', quien: 'Mili' },
  { numero: '7654321', tipo: 'propia_ahorro', nombre: 'OCA Blue ahorro' },
  { numero: '9999999', tipo: 'propia_interna', nombre: 'Cuenta de Mili' },
];
const ctx = { reglas, cuentas };
const consumo = raw => ({ tipo: 'consumo_credito', medio: 'Visa 1111', comercio_raw: raw });
const transf = (n, banco = 'Itau') => ({ tipo: 'transferencia', medio: 'Cuenta 3333', cuenta_destino: n, banco_destino: banco });

describe('quienFor', () => {
  it('maps own cards to their holder', () => {
    expect(quienFor('Débito 5555', cuentas)).toBe('Mili');
    expect(quienFor('Visa 1111', cuentas)).toBe('Compartido');
    expect(quienFor('Cuenta 3333', cuentas)).toBe('Compartido');
  });
});

describe('classify', () => {
  it('exact beats contains', () => {
    expect(classify(consumo('DEVOTO EXPRESS VIS3'), ctx)).toMatchObject({ categoria: 'Casa', clasificado_por: 'regla_exacta', revisado: true });
  });
  it('contains, longest pattern wins', () => {
    expect(classify(consumo('DEVOTO AROCENA VIS3'), ctx)).toMatchObject({ categoria: 'Supermercado', clasificado_por: 'regla_contiene', descripcion: 'Devoto' });
    expect(classify(consumo('UBER EATS PEDIDO'), ctx).categoria).toBe('Delivery');
    expect(classify(consumo('DLO*UBER*RIDES MONTE'), ctx).categoria).toBe('Transporte');
  });
  it('contains matches whole words only', () => {
    expect(classify(consumo('COMPUTER SHOP'), ctx).clasificado_por).toBe('pendiente');
  });
  it('no match → Otros pendiente sin revisar', () => {
    expect(classify(consumo('MERPAGO*KIOSCO PEPE'), ctx)).toEqual({ categoria: 'Otros', quien: 'Compartido', descripcion: 'Kiosco Pepe', clasificado_por: 'pendiente', revisado: false, comercio: 'KIOSCO PEPE' });
  });
  it('transfers use the account memory', () => {
    expect(classify(transf('1234567'), ctx)).toMatchObject({ categoria: 'Estética/Cosmética', quien: 'Mili', descripcion: 'Peluquería', clasificado_por: 'cuenta' });
    expect(classify(transf('7654321'), ctx).categoria).toBe('Ahorro/Inversión');
    expect(classify(transf('9999999'), ctx).categoria).toBe('Movimiento interno');
  });
  it('unknown transfer falls back to bank-name rules, else pending', () => {
    expect(classify(transf('3111225', 'Midinero'), ctx)).toMatchObject({ categoria: 'Servicio doméstico', clasificado_por: 'regla_contiene' });
    expect(classify(transf('42'), ctx)).toMatchObject({ categoria: 'Otros', clasificado_por: 'pendiente', descripcion: 'Transferencia a Itau 42' });
  });
  it('card payments are internal movements', () => {
    expect(classify({ tipo: 'pago_tarjeta', medio: 'Visa 1111' }, ctx)).toMatchObject({ categoria: 'Movimiento interno', revisado: true });
  });
  it('never touches a locked movement', () => {
    const m = { ...consumo('DEVOTO X'), bloqueado: true, categoria: 'Regalos y Cumpleaños', quien: 'Juani', descripcion: 'Regalo', clasificado_por: 'manual', revisado: true };
    expect(classify(m, ctx)).toMatchObject({ categoria: 'Regalos y Cumpleaños', quien: 'Juani', clasificado_por: 'manual' });
  });
  it('own card of Mili sets quien', () => {
    expect(classify({ ...consumo('DEVOTO'), medio: 'Débito 5555' }, ctx).quien).toBe('Mili');
  });
});

describe('applyToSimilar', () => {
  it('re-classifies only pending unlocked movements', () => {
    const movs = [
      { id: 'a', ...consumo('KIOSCO PEPE'), clasificado_por: 'pendiente' },
      { id: 'b', ...consumo('KIOSCO PEPE'), clasificado_por: 'pendiente', bloqueado: true },
      { id: 'c', ...consumo('OTRO'), clasificado_por: 'pendiente' },
    ];
    const more = { reglas: [...reglas, { tipo: 'exacta', patron: 'KIOSCO PEPE', categoria: 'Casa', descripcion: 'Kiosco' }], cuentas };
    const changed = applyToSimilar(movs, more.reglas, more.cuentas);
    expect(changed.map(m => m.id)).toEqual(['a']);
    expect(changed[0]).toMatchObject({ categoria: 'Casa', clasificado_por: 'regla_exacta', revisado: true });
  });
});
