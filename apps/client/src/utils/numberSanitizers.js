/**
 * Sanitizes input to only allow positive integer digits [0-9].
 */
export function onlyDigits(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '');
}

/**
 * Sanitizes input to allow positive decimal numbers (e.g. 1250.50).
 * Preserves at most one decimal point.
 */
export function onlyDecimal(val) {
  if (val === null || val === undefined) return '';
  const clean = String(val).replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
}

/**
 * Sanitizes phone input to only allow digits, spaces, hyphens, and parentheses.
 */
export function onlyPhoneDigits(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[^\d\s\-()]/g, '');
}

/**
 * Blocks typing non-numeric characters in onKeyDown events.
 * Allows Backspace, Delete, Arrow keys, Tab, Enter, Copy/Paste/Select shortcuts.
 */
export function handleNumericKeyDown(e, allowDecimal = false) {
  // Allow control/navigation keys
  if (
    [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Enter',
      'Escape',
      'Home',
      'End',
    ].includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }

  // Allow single decimal point if permitted
  if (allowDecimal && e.key === '.') {
    if (e.currentTarget.value.includes('.')) {
      e.preventDefault();
    }
    return;
  }

  // Block any non-digit character (including 'e', 'E', '+', '-')
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}
