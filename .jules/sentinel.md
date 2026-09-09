## 2024-05-24 - [Replaced insecure Math.random with crypto module]
**Vulnerability:** Found `Math.random()` being used to generate OTPs, tokens, and referral codes which is cryptographically insecure and predictable.
**Learning:** Using `Math.random()` to generate random strings for OTP verification, reference verification tokens, and referral codes can lead to token prediction attacks.
**Prevention:** Always use Node.js `crypto` module (e.g. `crypto.randomBytes`, `crypto.randomInt`) or Web Crypto API (`crypto.randomUUID()`) for any security-sensitive random value generation.
