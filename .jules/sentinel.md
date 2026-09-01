## 2024-05-30 - Insecure Random Number Generation for Security Contexts
**Vulnerability:** The codebase was using `Math.random()` to generate authentication tokens (OTPs) and reference request verification tokens.
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG). Using it for security-sensitive tokens can make them predictable, allowing attackers to guess tokens and bypass authentication or authorization checks.
**Prevention:** Always use Node's built-in `crypto` module (`crypto.randomBytes()` or `crypto.randomInt()`) for generating any security-related tokens, OTPs, or passwords.
