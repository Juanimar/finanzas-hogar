import { describe, it, expect } from 'vitest';
import { learnFromEdit, consolidate } from '../src/core/learn.js';

const NOW = '2026-11-09 10:00:00';

describe('learnFromEdit', () => {
  const mov = { tipo: 'consumo_credito', comercio: 'KIOSCO PEPE', categoria: 'Otros', clasificado_por: 'pendiente', quien: 'Compartido' };
  it('correction creates an exact rule', () => {
    const r = learnFromEdit(mov, { categoria: 'Casa', descripcion: 'Kiosco' }, { reglas: [], cuentas: [] }, NOW);
    expect(r.cuentaUpsert).toBeNull();
    expect(r.reglaUpsert).toMatchObject({ tipo: 'exacta', patron: 'KIOSCO PEPE', categoria: 'Casa', descripcion: 'Kiosco', origen: 'correccion', creada: NOW });
  });
  it('confirmation records origen confirmacion', () => {
    const r = learnFromEdit({ ...mov, categoria: 'Casa' }, { categoria: 'Casa' }, { reglas: [], cuentas: [] }, NOW);
    expect(r.reglaUpsert.origen).toBe('confirmacion');
  });
  it('updates an existing exact rule instead of duplicating', () => {
    const reglas = [{ id: 'r1', tipo: 'exacta', patron: 'KIOSCO PEPE', categoria: 'Casa', descripcion: 'Kiosco', usos: 3 }];
    const r = learnFromEdit(mov, { categoria: 'Supermercado' }, { reglas, cuentas: [] }, NOW);
    expect(r.reglaUpsert).toMatchObject({ id: 'r1', categoria: 'Supermercado', descripcion: 'Kiosco', usos: 3, modificada: NOW });
  });
  it('learns quien when set explicitly', () => {
    const r = learnFromEdit(mov, { categoria: 'Casa', quien: 'Mili' }, { reglas: [], cuentas: [] }, NOW);
    expect(r.reglaUpsert.quien).toBe('Mili');
  });
  it('transfers learn into the account memory', () => {
    const t = { tipo: 'transferencia', cuenta_destino: '42', banco_destino: 'Itau', categoria: 'Otros' };
    const r = learnFromEdit(t, { categoria: 'Estética/Cosmética', nombreCuenta: 'Peluquería' }, { reglas: [], cuentas: [] }, NOW);
    expect(r.reglaUpsert).toBeNull();
    expect(r.cuentaUpsert).toEqual({ numero: '42', banco: 'Itau', nombre: 'Peluquería', tipo: 'tercero', titular: '', categoria: 'Estética/Cosmética', quien: '' });
    const s = learnFromEdit(t, { categoria: 'Ahorro/Inversión', nombreCuenta: 'OCA' }, { reglas: [], cuentas: [] }, NOW);
    expect(s.cuentaUpsert.tipo).toBe('propia_ahorro');
  });
  it('movements without merchant learn nothing', () => {
    expect(learnFromEdit({ tipo: 'manual', comercio: '' }, { categoria: 'Casa' }, { reglas: [], cuentas: [] }, NOW)).toEqual({ reglaUpsert: null, cuentaUpsert: null });
  });
});

describe('consolidate', () => {
  const ex = (patron, categoria) => ({ tipo: 'exacta', patron, categoria });
  it('groups shared tokens into a contains rule', () => {
    const out = consolidate([ex('DEVOTO EXPRESS', 'Supermercado'), ex('DEVOTO AROCENA', 'Supermercado')], NOW);
    expect(out).toEqual([expect.objectContaining({ tipo: 'contiene', patron: 'DEVOTO', categoria: 'Supermercado', origen: 'agrupacion' })]);
  });
  it('ignores stopwords and short tokens', () => {
    expect(consolidate([ex('PEDIDOSYA ENVIO', 'Delivery'), ex('RAPPI ENVIO', 'Delivery'), ex('BAR UNO', 'ComidaSocial'), ex('BAR DOS', 'ComidaSocial')], NOW)).toEqual([]);
  });
  it('skips tokens shared across categories', () => {
    expect(consolidate([ex('DEVOTO AROCENA', 'Supermercado'), ex('FREDDO AROCENA', 'ComidaSocial'), ex('FARO AROCENA', 'ComidaSocial')], NOW)).toEqual([]);
  });
  it('skips if a contains rule already exists for the token', () => {
    expect(consolidate([ex('DEVOTO A', 'Supermercado'), ex('DEVOTO B', 'Supermercado'), { tipo: 'contiene', patron: 'DEVOTO', categoria: 'Casa' }], NOW)).toEqual([]);
  });
});

describe('consolidate — review fixes', () => {
  const ex = (patron, categoria) => ({ tipo: 'exacta', patron, categoria });
  it('duplicate copies of one merchant do not count as two', () => {
    expect(consolidate([ex('KIOSCO PEPE', 'Casa'), ex('KIOSCO PEPE', 'Casa')], NOW)).toEqual([]);
  });
  it('generic retail words never group', () => {
    expect(consolidate([ex('FOO EXPRESS', 'Casa'), ex('BAR EXPRESS', 'Casa'), ex('ACME SHOP', 'Casa'), ex('ZETA SHOP', 'Casa'), ex('UNO ONLINE', 'Casa'), ex('DOS ONLINE', 'Casa')], NOW)).toEqual([]);
  });
});
