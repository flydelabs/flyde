import { PostHog } from 'posthog-node';
import * as vscode from 'vscode';

interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
}

interface TelemetryException {
  error: Error;
  properties?: Record<string, any>;
}


class FlydeAnalytics {
  private posthog: PostHog | null = null;
  private userId: string | null = null;
  private isEnabled = false;
  private isTestEnvironment = false;
  private context: vscode.ExtensionContext | null = null;
  private staticInfo: Record<string, any> = {};

  constructor() {
    // Detect test environment
    this.isTestEnvironment = process.env.NODE_ENV === 'test' ||
      process.env.VSCODE_TEST === 'true' ||
      process.argv.some(arg => arg.includes('runTest'));

    if (this.isTestEnvironment) {
      // In test environment, disable analytics completely
      this.userId = 'test-user';
      this.isEnabled = false;
      return;
    }

    try {
      this.initializeUserId();
      this.updateConfiguration();

      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('flyde.telemetry')) {
          this.updateConfiguration();
        }
      });
    } catch (error) {
      // Fallback for any initialization errors
      this.userId = this.generateAnonymousId();
      this.isEnabled = false;
    }
  }

  private initializeUserId(): void {
    // Generate anonymous ID - context will be set during activation
    this.userId = this.generateAnonymousId();
  }

  public setContext(context: vscode.ExtensionContext): void {
    this.context = context;

    if (this.isTestEnvironment) {
      return;
    }

    // Load or create persistent user ID
    const storedUserId = context.globalState.get<string>('flyde_user_id');
    if (storedUserId) {
      this.userId = storedUserId;
    } else {
      // Store the generated ID persistently
      this.userId = this.generateAnonymousId();
      context.globalState.update('flyde_user_id', this.userId);
    }

  }

  private generateAnonymousId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getFlydeVersion(): string | undefined {
    return vscode.extensions.getExtension('flyde.flyde-vscode')?.packageJSON.version;
  }

  private buildStaticInfo(): void {
    this.staticInfo = {
      flydeVersion: this.getFlydeVersion(),
      vscodeVersion: vscode.version,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      osRelease: require('os').release(),
      osType: require('os').type(),
      editorName: vscode.env.appName,
    };
  }

  private updateConfiguration(): void {
    const config = vscode.workspace.getConfiguration('flyde.telemetry');
    const enabled = config.get<boolean>('enabled', true);

    const vscodeEnabled = vscode.env.isTelemetryEnabled;

    this.isEnabled = enabled && vscodeEnabled;

    if (this.isEnabled && !this.posthog) {
      // Build static info before initializing PostHog
      this.buildStaticInfo();
      const apiKey = 'phc_Sfg0m6OUVf32CH7J3tC0M9ikI3cWf1plqoPVO08OP82';
      this.posthog = new PostHog(apiKey, {
        host: 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 1000,
        personalApiKey: undefined,
        featureFlagsPollingInterval: 0,
        requestTimeout: 10000,
      });
    } else if (!this.isEnabled && this.posthog) {
      this.posthog.shutdown();
      this.posthog = null;
    }
  }

  public activate(): void {
    if (this.isTestEnvironment) {
      return;
    }

    this.updateConfiguration();

    if (this.isEnabled) {
      this.reportEvent('activate');
    }
  }

  public refreshConfiguration(): void {
    this.updateConfiguration();
  }

  public reportEvent(eventName: string, properties?: Record<string, any>): void {
    if (this.isTestEnvironment || !this.isEnabled || !this.posthog) {
      return;
    }

    const sanitizedProperties = this.sanitizeProperties(properties);
    const eventData: Record<string, any> = {
      ...this.staticInfo,
      ...sanitizedProperties,
      timestamp: new Date().toISOString(),
    };

    this.posthog.capture({
      distinctId: this.userId!,
      event: eventName,
      properties: eventData
    });
  }

  public reportException(error: Error, properties?: Record<string, any>): void {
    if (this.isTestEnvironment || !this.isEnabled || !this.posthog) {
      return;
    }

    const sanitizedProperties = this.sanitizeProperties(properties);
    const errorData: Record<string, any> = {
      ...this.staticInfo,
      ...sanitizedProperties,
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
    };

    this.posthog.capture({
      distinctId: this.userId!,
      event: 'exception',
      properties: errorData
    });
  }


  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (this.isSafeProperty(key, value)) {
        sanitized[key] = this.sanitizeValue(value);
      }
    }

    return sanitized;
  }

  private isSafeProperty(key: string, value: any): boolean {
    const sensitiveKeys = [
      'token', 'password', 'secret', 'key', 'auth', 'credential',
      'email', 'username', 'user', 'name', 'id', 'uuid', 'path',
      'file', 'directory', 'folder', 'content', 'code', 'data'
    ];

    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      return false;
    }

    if (typeof value === 'string' && value.length > 100) {
      return false;
    }

    return true;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.length;
    }

    if (value && typeof value === 'object') {
      return '[Object]';
    }

    return value;
  }

  public dispose(): void {
    if (this.posthog) {
      this.posthog.shutdown();
    }
  }
}

export const analytics = new FlydeAnalytics();

export const reportEvent = (eventName: string, properties?: Record<string, any>): void => {
  analytics.reportEvent(eventName, properties);
};

export const reportException = (error: Error, properties?: Record<string, any>): void => {
  analytics.reportException(error, properties);
};

export const activateReporter = (): void => {
  analytics.activate();
};

export const refreshAnalyticsConfiguration = (): void => {
  analytics.refreshConfiguration();
};
