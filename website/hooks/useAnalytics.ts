import { usePostHog } from 'posthog-js/react';
import { sendGAEvent } from '@next/third-parties/google';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  gaCategory?: string;
  gaLabel?: string;
  gaValue?: number;
}

export function useAnalytics() {
  const posthog = usePostHog();

  const track = (event: AnalyticsEvent) => {
    // Skip tracking in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // Track with PostHog
    posthog?.capture(event.name, event.properties);

    // Track with Google Analytics if GA-specific properties are provided
    if (event.gaCategory) {
      sendGAEvent('event', event.name, {
        event_category: event.gaCategory,
        event_label: event.gaLabel,
        value: event.gaValue,
        ...event.properties
      });
    }
  };

  const identify = (userId: string, properties?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') return;
    posthog?.identify(userId, properties);
  };

  const reset = () => {
    if (process.env.NODE_ENV === 'development') return;
    posthog?.reset();
  };

  const setFeatureFlag = (flag: string, value: boolean) => {
    if (process.env.NODE_ENV === 'development') return;
    posthog?.setPersonProperties({ [flag]: value });
  };

  return {
    track,
    identify,
    reset,
    setFeatureFlag,
    posthog
  };
} 