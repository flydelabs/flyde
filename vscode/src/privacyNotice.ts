import * as vscode from 'vscode';
import { refreshAnalyticsConfiguration } from './analytics';

interface PrivacyNoticeResult {
  enabled: boolean;
}

export async function showFirstRunPrivacyNotice(context?: vscode.ExtensionContext): Promise<PrivacyNoticeResult> {
  const config = vscode.workspace.getConfiguration('flyde.telemetry');
  const hasShownNotice = context?.globalState.get<boolean>('flyde_privacy_notice_shown', false) ?? false;
  
  if (hasShownNotice) {
    return {
      enabled: config.get<boolean>('enabled', true)
    };
  }

  const choice = await vscode.window.showInformationMessage(
    'Flyde collects anonymous usage data to help improve the extension. No personal information is collected. You can disable this in the extension settings at any time.',
    'Got it',
    'Open Settings'
  );

  if (choice === 'Open Settings') {
    vscode.commands.executeCommand('workbench.action.openSettings', 'flyde.telemetry');
  }

  // Mark that we've shown the notice
  if (context) {
    await context.globalState.update('flyde_privacy_notice_shown', true);
  }
  
  return {
    enabled: config.get<boolean>('enabled', true)
  };
}

async function updateTelemetrySettings(settings: PrivacyNoticeResult): Promise<void> {
  const config = vscode.workspace.getConfiguration('flyde.telemetry');
  await config.update('enabled', settings.enabled, vscode.ConfigurationTarget.Global);
  
  // Refresh analytics configuration to apply changes immediately
  refreshAnalyticsConfiguration();
}

export async function showPrivacySettings(): Promise<void> {
  const config = vscode.workspace.getConfiguration('flyde.telemetry');
  const currentEnabled = config.get<boolean>('enabled', true);
  
  const status = currentEnabled ? 'Currently: Analytics Enabled' : 'Currently: Analytics Disabled';

  const choice = await vscode.window.showQuickPick([
    {
      label: '$(check) Enable Analytics',
      description: 'Help improve Flyde',
      detail: 'Anonymous usage data to improve features and fix bugs',
      value: { enabled: true }
    },
    {
      label: '$(circle-slash) Disable Analytics',
      description: 'No data collection',
      detail: 'Turn off all analytics collection',
      value: { enabled: false }
    }
  ], {
    placeHolder: `${status} - Choose your privacy preference`,
    ignoreFocusOut: true
  });

  if (choice) {
    await updateTelemetrySettings(choice.value as PrivacyNoticeResult);
    const newStatus = choice.value.enabled ? 'Analytics enabled' : 'Analytics disabled';
    vscode.window.showInformationMessage(`✓ ${newStatus}`);
  }
}