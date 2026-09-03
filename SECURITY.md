# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| < 1.8   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in @kagunex/baileys, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, please email the maintainers or open a private security advisory on the GitHub repository:

https://github.com/Kagunex/baileys/security/advisories

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within a reasonable timeframe and work with you to address the issue.

## Security Notes

- Pairing codes are kept in memory only during the pairing process and are not persisted to disk unnecessarily.
- Auth credentials (noise keys, identity keys, sessions) should never be committed to version control.
- Use `useMultiFileAuthState` with a private directory outside of source control.
- Avoid logging full phone numbers or credentials in production logs.
