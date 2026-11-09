export function Sheet({ title, onClose, children }) {
  return (
    <div class="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="sheet">
        <div class="sheet-head"><b>{title}</b><button class="ghost" onClick={onClose} aria-label="Cerrar">✕</button></div>
        {children}
      </div>
    </div>
  );
}
