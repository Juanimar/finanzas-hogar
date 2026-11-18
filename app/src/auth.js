import { CLIENT_ID, SCOPES, ALLOWED_EMAILS } from './config.js';

const KEY = 'fh.token';
let tokenClient = null;

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar el login de Google'));
    document.head.appendChild(s);
  });
}

export function savedToken() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || 'null');
    return t && t.expires > Date.now() + 60000 ? t : null;
  } catch { return null; }
}

async function emailFor(accessToken) {
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error('No se pudo leer el usuario');
  return (await r.json()).email?.toLowerCase();
}

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
export const FALTA_PERMISO = 'Falta el permiso para la planilla. Tocá "Entrar con Google" y, en la pantalla de permisos, tildá la casilla de Google Sheets ("ver, editar, crear y eliminar…").';

export async function signIn({ silent = false, consent = false } = {}) {
  await loadGis();
  const resp = await new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPES,
      callback: r => (r.error ? reject(new Error(r.error)) : resolve(r)),
      error_callback: e => reject(new Error(e.type || 'login cancelado')),
    });
    tokenClient.requestAccessToken({ prompt: silent ? '' : consent ? 'consent select_account' : 'select_account' });
  });
  // Google deja destildar permisos en la pantalla de consentimiento: sin el de Sheets, todo da 403.
  if (!window.google.accounts.oauth2.hasGrantedAllScopes(resp, SHEETS_SCOPE)) throw new Error(FALTA_PERMISO);
  const email = await emailFor(resp.access_token);
  if (!ALLOWED_EMAILS.includes(email)) throw new Error(`${email} no tiene acceso a esta app`);
  const t = { access: resp.access_token, expires: Date.now() + resp.expires_in * 1000, email };
  localStorage.setItem(KEY, JSON.stringify(t));
  return t;
}

export function signOut() {
  localStorage.removeItem(KEY);
}
