## 2024-05-18 - [Fix raw sql template literals]
**Vulnerability:** Raw sql string concatenation with `%` for LIKE query.
**Learning:** Using string interpolation inside Drizzle ORM `sql` tagged template literals can trigger false positives on static analysis tools and encourage bad practices.
**Prevention:** Prefer built-in ORM operators (e.g., `ilike`) over `sql` template tags with manual string concatenation.
