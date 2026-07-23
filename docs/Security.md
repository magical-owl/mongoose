# Security Guidelines

## Expo Secure Store Usage

### When to Use Secure Store

Expo Secure Store uses the platform-native keychain (iOS Keychain / Android EncryptedSharedPreferences) for storing sensitive data:

| Data Type | Store Method | Example |
|-----------|-------------|---------|
| Authentication tokens | Secure Store | `accessToken`, `refreshToken` |
| API keys | Secure Store | Third-party service API keys |
| User session data | Secure Store | Session identifiers |
| Cryptographic keys | Secure Store | Encryption/decryption keys |
| Non-sensitive preferences | AsyncStorage | Theme preference, language |

### Implementation

```typescript
// src/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
}

export async function deleteAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
}
```

### Security Considerations

- Use `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for tokens (requires device unlock, not backed up).
- Never store tokens in AsyncStorage, Redux, or app state.
- Clear Secure Store on logout and token refresh.
- Handle SecureStore errors gracefully (device may not support it on older Android versions).
- Use `isAvailableAsync()` to check device support before reading/writing.

## Data Encryption at Rest

### Local Data Encryption

- **AsyncStorage**: Not encrypted. Store only non-sensitive user preferences.
- **expo-secure-store**: Encrypted via iOS Keychain (AES-256-GCM) or Android EncryptedSharedPreferences (AES-256).
- **SQLite**: Use `expo-sqlite` with encryption or `op-sqlcipher` for encrypted local databases if storing user-generated content.
- **File storage**: Use `expo-file-system` with `FileSystem.StorageAccessFramework` for sensitive file access. Consider encrypting files before writing to disk using a library like react-native-aes-crypto.

### Encryption at Rest Requirements

```
┌─────────────────────────────┬────────────────────┬──────────────────┐
│ Data Category               │ Encryption Required│ Mechanism         │
├─────────────────────────────┼────────────────────┼──────────────────┤
│ Authentication tokens       │ Yes                │ Secure Store     │
│ User profile data           │ Yes                │ Secure Store     │
│ User-generated content      │ Yes                │ Encrypted SQLite │
│ App preferences             │ No                 │ AsyncStorage     │
│ Cache data                  │ No                 │ File system      │
│ Crash reports               │ No (anonymized)    │ Sentry           │
└─────────────────────────────┴────────────────────┴──────────────────┘
```

## Data Encryption in Transit

### TLS Requirements

- All API communication must use TLS 1.2 or TLS 1.3.
- Disable SSL/TLS compression to prevent CRIME/BREACH attacks.
- Implement certificate pinning (see below).
- Validate server certificates on every request.
- Never allow self-signed certificates in production builds.

### Network Security Configuration

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.meadowapp.com</domain>
    <domain includeSubdomains="true">auth.meadowapp.com</domain>
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </domain-config>
</network-security-config>
```

### WebSocket Security

- Use `wss://` for all WebSocket connections.
- Authenticate WebSocket connections using the same token-based authentication as REST API.
- Implement connection timeout and reconnection with exponential backoff.

## Certificate Pinning Preparation

### Approach

Use react-native-ssl-pinning or expo's built-in network layer with certificate pinning support.

```typescript
// src/services/apiClient.ts
import { create } from 'apisauce';
import { Platform } from 'react-native';

const apiClient = create({
  baseURL: 'https://api.meadowapp.com',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  // Certificate pinning configuration
  sslPinning: {
    certs: ['certificate_hash_1', 'certificate_hash_2'],  // SHA-256 hashes
  },
});
```

### Certificate Management

- Pin at least two certificates: the current leaf certificate and a backup (intermediate or cross-signed root).
- Store certificate hashes in environment variables, not hardcoded.
- Implement a certificate rotation mechanism:
  1. Add new certificate hash to codebase.
  2. Deploy update to all users.
  3. Wait for adoption threshold (>90%).
  4. Remove old certificate hash.
- Monitor certificate expiration dates and schedule rotation before expiry.

## Input Validation Rules

### Client-Side Validation

```typescript
// src/utils/validation.ts
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
    message: 'Please enter a valid email address.',
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    message:
      'Password must be 8-128 characters with uppercase, lowercase, digit, and special character.',
  },
  displayName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9 _.-]+$/,
    message: 'Display name must be 2-50 alphanumeric characters.',
  },
  phoneNumber: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Please enter a valid phone number in E.164 format.',
  },
};

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')       // Strip HTML tags
    .replace(/['"]/g, '')       // Strip quotes
    .trim();
}

export function validateEmail(email: string): boolean {
  return (
    VALIDATION_RULES.email.pattern.test(email) &&
    email.length <= VALIDATION_RULES.email.maxLength
  );
}
```

### Validation Rules Summary

| Field Type | Client Validation | Server Validation | Sanitization |
|-----------|------------------|-------------------|--------------|
| Email | Pattern, length | Pattern, length, domain MX check | Trim, lowercase |
| Password | Length, complexity | Length, complexity | None (hash before storage) |
| Display name | Length, character set | Length, character set, profanity filter | Strip HTML, trim |
| Free text | Max length | Max length, XSS check | Strip HTML, encode entities |
| URLs | Format, protocol | Format, allowlist domains | Encode, validate scheme |
| Phone numbers | E.164 format | E.164 format | Strip non-digit characters |

## Secure Logging (No PII)

### Logging Policy

- Never log authentication tokens, passwords, or API keys.
- Never log full user names, email addresses, phone numbers, or physical addresses.
- Never log device identifiers (IDFA, Android ID, device serial numbers).
- Never log user-generated content that may contain PII.
- Mask or truncate sensitive data before logging.

### Implementation

```typescript
// src/services/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const SENSITIVE_KEYS = ['token', 'password', 'secret', 'key', 'authorization', 'ssn', 'email', 'phone'];
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private maskUserIdentifiers(entry: LogEntry): LogEntry {
    // Mask email-like patterns
    const maskedMessage = entry.message.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[EMAIL REDACTED]');

    // Mask phone-like patterns
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const fullyMasked = maskedMessage.replace(phonePattern, '[PHONE REDACTED]');

    return { ...entry, message: fullyMasked };
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    let entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.maskSensitiveData(context) : undefined,
    };

    entry = this.maskUserIdentifiers(entry);

    if (__DEV__) {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context ?? '');
    } else {
      // Send to remote logging service (Sentry, etc.)
      // Sentry.captureMessage(entry.message, entry.level);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
```

## Authentication Flow

### Authentication Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│  Auth Server │────▶│  Token Store │
└──────────┘     └──────────────┘     └──────────────┘
      │                                      │
      │                                      ▼
      │                              ┌──────────────┐
      │                              │ Secure Store │
      │                              │ (Device)     │
      │                              └──────────────┘
      │
      ▼
┌──────────────┐
│  API Client  │
│  (with token)│
└──────────────┘
```

### Token Management

```typescript
// src/services/authService.ts
import { saveAccessToken, getAccessToken, deleteAccessToken } from './secureStorage';
import { apiClient } from './apiClient';
import { logger } from './logger';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await apiClient.post<AuthTokens>('/auth/login', {
        email,
        password,
      });

      await saveAccessToken(response.data.accessToken);
      this.scheduleTokenRefresh(response.data.expiresIn);
    } catch (error) {
      logger.error('Login failed', { errorMessage: (error as Error).message });
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await apiClient.post<AuthTokens>('/auth/refresh');
      await saveAccessToken(response.data.accessToken);
      this.scheduleTokenRefresh(response.data.expiresIn);
    } catch (error) {
      logger.error('Token refresh failed', { errorMessage: (error as Error).message });
      await this.logout();
      throw error;
    }
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    // Refresh 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    this.refreshTimeout = setTimeout(() => this.refreshToken(), refreshTime);
  }

  async logout(): Promise<void> {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    await deleteAccessToken();
  }

  async getValidToken(): Promise<string | null> {
    return getAccessToken();
  }
}
```

### Security Best Practices

- Use short-lived access tokens (15-30 minutes) with refresh tokens.
- Refresh tokens should have rotation: each refresh issues a new refresh token and invalidates the old one.
- Store tokens in Secure Store with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` flag.
- Implement token revocation on server side.
- Use HTTPS for all authentication endpoints.
- Implement rate limiting on login and token refresh endpoints.
- Add biometric authentication for sensitive operations (payments, password change).
- Clear all tokens and cached data on logout.

## Authorization Model

### Role-Based Access Control (RBAC)

```typescript
// src/services/authorization.ts
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum Permission {
  READ_CONTENT = 'read:content',
  CREATE_CONTENT = 'create:content',
  EDIT_CONTENT = 'edit:content',
  DELETE_CONTENT = 'delete:content',
  MANAGE_USERS = 'manage:users',
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_ANALYTICS = 'view:analytics',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [Permission.READ_CONTENT],
  [UserRole.USER]: [Permission.READ_CONTENT, Permission.CREATE_CONTENT, Permission.EDIT_CONTENT],
  [UserRole.PREMIUM]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
  ],
  [UserRole.MODERATOR]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MANAGE_USERS,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function authorize(requiredPermission: Permission) {
  return (userRole: UserRole): boolean => {
    return hasPermission(userRole, requiredPermission);
  };
}
```

### Authorization Enforcement

- Authorize on the client side for UI rendering (show/hide elements).
- Always enforce authorization on the server side for API access.
- Never rely solely on client-side authorization for security.
- Return 403 Forbidden from API for unauthorized requests.

## API Security Headers

### Request Headers

```typescript
// src/services/apiClient.ts
const apiClient = create({
  baseURL: 'https://api.meadowapp.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Version': AppVersion,
    'X-Platform': Platform.OS,
  },
  timeout: 10000,
});
```

### Response Headers (Server Configuration)

The server should return the following security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforce HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer header |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restrict API access |
| `Cache-Control` | `no-store, no-cache, must-revalidate` | Prevent sensitive data caching |

## Dependency Vulnerability Scanning

### Scanning Tools

```bash
# npm audit for known vulnerabilities
npm audit

# Yarn audit
yarn audit

# Snyk CLI for comprehensive scanning
npx snyk test
npx snyk monitor

# OWASP Dependency-Check (CI pipeline)
npx dependency-check --project "Meadow" --scan ./ --format HTML
```

### CI Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6 AM

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### Vulnerability Management Process

1. **Identification**: Automated scanning in CI/CD pipeline.
2. **Triage**: Assess severity and impact within 24 hours.
3. **Patch**: Apply patches or mitigations within SLA:
   - Critical: 48 hours
   - High: 7 days
   - Medium: 30 days
   - Low: Next release cycle
4. **Verify**: Re-scan after patching.
5. **Document**: Record vulnerability, impact, and remediation in security log.

### Dependency Update Policy

- Pin exact versions in `package.json` for production dependencies.
- Review dependency updates in pull requests.
- Avoid adding new dependencies without security review.
- Use `npm audit` or `yarn audit` before each release.
- Monitor GitHub Dependabot alerts for the repository.
- Subscribe to security advisories for major dependencies (React Native, Expo, etc.).
