## 2026-08-30 - [Fix Weak Random Number Generation in Token]
**Vulnerability:** Weak random number generation used in `src/app/dashboard/nanny/verification/actions.ts` for a secure token using `Math.random().toString(36).substring(2, 15)`. This is predictable and should not be used for security-sensitive tokens, especially for authentication or authorization logic like a reference submission token.
**Learning:** Avoid `Math.random()` for anything security-related since it's cryptographically insecure.
**Prevention:** Use a cryptographically secure pseudo-random number generator (CSPRNG) such as Node.js's `crypto.randomBytes()` or `crypto.randomUUID()` to generate secure tokens.
