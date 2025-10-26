import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

// Notification type configurations
type NotificationType = 'alpha-feedback';

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
                // User said no thanks. Switch to acknowledgment state.
                setAcknowledged(true);
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