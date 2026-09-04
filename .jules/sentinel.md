## 2024-10-24 - [Insecure Randomness for Security Tokens]
**Vulnerability:** Found `Math.random()` being used to generate OTPs (One Time Passwords) and reference submission verification tokens. `Math.random()` is predictable and not cryptographically secure, which could allow attackers to guess tokens and bypass verification checks or take over accounts.
**Learning:** Security-sensitive random numbers, such as OTPs, session IDs, and verification tokens, must be generated using a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG).
**Prevention:** In Node.js environments, always use `crypto.randomBytes()` for random strings/tokens and `crypto.randomInt()` for random numbers within a range instead of `Math.random()`.
