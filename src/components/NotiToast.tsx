import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

/**
 * Banner-style notification toast system
 *
 * Usage:
 *
 * 1. Add a new notification type to the NotificationType union below
 * 2. Add its configuration to the notificationConfigs object
 * 3. Call showNotiToast('your-type') anywhere in your app
 *
 * Example:
 * ```tsx
 * // Show immediately
 * showNotiToast('release-notes');
 *
 * // Show after a delay (e.g., in a useEffect)
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     if (localStorage.getItem('showMyNoti') !== 'false') {
 *       showNotiToast('my-notification');
 *       localStorage.setItem('showMyNoti', 'false');
 *     }
 *   }, 5000);
 *   return () => clearTimeout(timer);
 * }, []);
 * ```
 *
 * Notes:
 * - If ackTitle and ackDescription are provided, clicking dismiss shows a second
 *   acknowledgment screen before auto-dismissing after 4 seconds
 * - If ackTitle and ackDescription are omitted, clicking dismiss closes immediately
 * - Primary button can have an href (opens in new tab) and/or onClick handler
 */

// Notification type configurations
type NotificationType = 'alpha-feedback' | 'release-notes';

interface NotiToastConfig {
  title: string;
  description: string;
  ackTitle?: string;
  ackDescription?: string;
  primaryButton: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissButton: {
    label: string;
  };
}

// add more noti types as needed
const notificationConfigs: Record<NotificationType, NotiToastConfig> = {
  'alpha-feedback': {
    title: 'Enjoying Rhizome?',
    description: 'Help us make it better with some quick feedback. It\'ll take 2 minutes 🌱',
    ackTitle: 'All good!',
    ackDescription: 'You can share feedback any time from the settings menu',
    primaryButton: {
      label: 'Share Feedback',
      href: 'https://tally.so/r/3EjzA2',
    },
    dismissButton: {
      label: 'Maybe later',
    },
  },
  'release-notes': {
    title: 'This is a new version of Rhizome',
    description: 'If something feels off, go to the "More" menu and hit "Feedback & Requests"',
    primaryButton: {
      label: 'See what\'s new',
      href: 'https://www.notion.so/seanathon/Rhizome-Changelog-2cd7b160b42a8090ace6d43d3803b2ae?source=copy_link',
    },
    dismissButton: {
      label: 'Dismiss',
    },
  },
};

/** Show a banner-style notification toast */
export function showNotiToast(
  type: NotificationType,
  options?: { feedbackFormUrl?: string }
) {
  const config = notificationConfigs[type];

  // Merge options into config
  const finalConfig = {
    ...config,
    primaryButton: {
      ...config.primaryButton,
      ...(options?.feedbackFormUrl && { href: options.feedbackFormUrl }),
    },
  };

  return sonnerToast.custom(
    (id) => <NotiToast id={id} config={finalConfig} />,
    {
      duration: Infinity,
    }
  );
}

/** Banner-style notification component */
function NotiToast({
  id,
  config,
}: {
  id: string | number;
  config: NotiToastConfig;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [autoDismissTimerSet, setAutoDismissTimerSet] = useState(false);

  const handlePrimaryAction = () => {
    if (config.primaryButton.href) {
      const a = document.createElement('a');
      a.href = config.primaryButton.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      // required so Firefox will honor it without adding it to the DOM
      document.body.appendChild(a);
      a.click();
      a.remove();
      sonnerToast.dismiss(id);
    }

    if (config.primaryButton.onClick) {
      config.primaryButton.onClick();
    }
  };

  // When the user has acknowledged (tapped "No thanks"), we swap content
  // and then auto-dismiss after a short delay so it feels lightweight.
  useEffect(() => {
    if (acknowledged && !autoDismissTimerSet) {
      const timer = setTimeout(() => {
        sonnerToast.dismiss(id);
      }, 4000);
      setAutoDismissTimerSet(true);
      return () => clearTimeout(timer);
    }
  }, [acknowledged, autoDismissTimerSet, id]);

  return (
    <div
      className="space-y-1 rounded-2xl bg-card border border-border text-foreground p-3 shadow-lg"
      style={{
        width: '100%',
        maxWidth: '400px',
      }}
    >
      {!acknowledged ? (
        <>
          <h2 className="text-lg font-semibold">{config.title}</h2>
          <p className="text-base text-muted-foreground">
            {config.description}
          </p>

          <div className="flex gap-2 mt-6">
            <Button onClick={handlePrimaryAction}>
              {config.primaryButton.label}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // If no acknowledgment message, dismiss immediately
                if (!config.ackTitle && !config.ackDescription) {
                  sonnerToast.dismiss(id);
                } else {
                  // Otherwise, switch to acknowledgment state
                  setAcknowledged(true);
                }
              }}
            >
              {config.dismissButton.label}
            </Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">
            {config.ackTitle ?? 'All good'}
          </h2>
          <p className="text-base text-muted-foreground">
            {config.ackDescription ??
              'You can share feedback any time from the settings menu.'}
          </p>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => sonnerToast.dismiss(id)}
            >
              Got it
            </Button>
          </div>
        </>
      )}
    </div>
  );
}