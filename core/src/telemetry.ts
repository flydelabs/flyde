export interface TelemetryEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
}

const TELEMETRY_ENDPOINT = 'https://flyde.dev/api/collect';

function sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (isSafeProperty(key, value)) {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}

function isSafeProperty(key: string, _value: any): boolean {
  const sensitiveKeys = [
    'token', 'password', 'secret', 'key', 'auth', 'credential',
    'email', 'username', 'path', 'file', 'content', 'code'
  ];

  const lowerKey = key.toLowerCase();
  if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
    return false;
  }

  return true;
}

function sanitizeValue(value: any): any {
  if (typeof value === 'string' && value.length > 100) {
    return '[Redacted]';
  }

  if (typeof value === 'object' && value !== null) {
    return '[Object]';
  }

  return value;
}

const FLYDE_VERSION = '__FLYDE_VERSION__'; // Replaced at build time

export function reportEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
): void {
  // Check if telemetry is disabled via environment variable
  if (typeof process !== 'undefined' && process.env?.FLYDE_TELEMETRY_DISABLED === 'true') {
    return;
  }

  // Fire and forget
  (async () => {
    try {
      const sanitizedProperties = sanitizeProperties(properties);
      const payload: TelemetryEvent = {
        distinctId,
        event,
        properties: {
          ...sanitizedProperties,
          flydeVersion: FLYDE_VERSION
        }
      };

      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      // Silently fail - telemetry should not break the app
    }
  })();
}