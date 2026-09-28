/**
 * securityHeaders
 * Sets common HTTP security response headers on every request.
 * Drop-in replacement if helmet is not installed, or use alongside it.
 *
 * Headers applied:
 *  - Content-Security-Policy   — restricts resource origins
 *  - Strict-Transport-Security — force HTTPS for 1 year (prod only)
 *  - X-Frame-Options           — clickjacking protection
 *  - X-Content-Type-Options    — prevent MIME sniffing
 *  - Referrer-Policy           — limit referrer leakage
 *  - Permissions-Policy        — disable unused browser features
 *  - X-XSS-Protection          — legacy XSS filter (IE/Edge)
 *
 * Usage:
 *   app.use(securityHeaders);
 */

const isProd = process.env.NODE_ENV === 'production';

export function securityHeaders(req, res, next) {
  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",   // tighten further if using nonces
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // HSTS — only send on HTTPS / production
  if (isProd) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Anti-clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Limit referrer info sent to external sites
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable browser features not needed by this app
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Legacy XSS filter (still honoured by some older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Remove fingerprinting header added by Express
  res.removeHeader('X-Powered-By');

  return next();
}

export default securityHeaders;
