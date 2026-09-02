## 2024-05-24 - [CRITICAL] Fix insecure random number generation for tokens
**Vulnerability:** Used Math.random() for security-sensitive tokens (OTP codes and user referral codes).
**Learning:** Found insecure `Math.random()` usage for generating OTPs in `src/app/api/auth/send-otp/route.ts` and referral codes in `src/db/schema.ts`. `Math.random()` is not cryptographically secure, and the resulting tokens are predictable and vulnerable to attacks.
**Prevention:** Always use Node.js's built-in `crypto` module (e.g., `crypto.randomInt` or `crypto.randomBytes`) or another Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) when generating sensitive tokens, secrets, or identifiers.
