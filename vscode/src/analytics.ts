import * as vscode from 'vscode';
import { reportEvent as coreReportEvent } from '@flyde/core';

interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
}

interface TelemetryException {
  error: Error;
  properties?: Record<string, any>;
}


class FlydeAnalytics {
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

    if (this.isEnabled) {
      // Build static info when enabling telemetry
      this.buildStaticInfo();
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
    if (this.isTestEnvironment || !this.isEnabled) {
      return;
    }

    const eventData: Record<string, any> = {
      ...this.staticInfo,
      ...properties,
      timestamp: new Date().toISOString(),
    };

    coreReportEvent(this.userId!, eventName, eventData);
  }

  public reportException(error: Error, properties?: Record<string, any>): void {
    if (this.isTestEnvironment || !this.isEnabled) {
      return;
    }

    const errorData: Record<string, any> = {
      ...this.staticInfo,
      ...properties,
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
    };

    coreReportEvent(this.userId!, 'exception', errorData);
  }


  public dispose(): void {
    // Nothing to dispose
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
