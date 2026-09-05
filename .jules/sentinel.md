## 2026-09-05 - [Fix Insecure Randomness]
**Vulnerability:** Weak random number generation for tokens and OTPs using `Math.random()`.
**Learning:** Avoid using `Math.random()` for generating sensitive tokens or OTPs, as it is predictable and cryptographically insecure.
**Prevention:** Always use a cryptographically secure pseudo-random number generator (CSPRNG) like Node's native `crypto.randomBytes(16).toString('hex')` for tokens and `crypto.randomInt()` for numeric OTPs.
