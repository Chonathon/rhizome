import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';

// Notification type configurations
type NotificationType = 'alpha-feedback';

interface NotiToastConfig {
  title: string;
  description: string;
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
    primaryButton: {
      label: 'Share Feedback',
      href: 'https://tally.so/r/3EjzA2',
    },
    dismissButton: {
      label: 'No thanks :(',
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

  return (
    <div
      className="space-y-1 rounded-2xl bg-card border border-border text-foreground p-3 shadow-lg"
      style={{
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <h2 className="text-lg font-semibold">{config.title}</h2>
      <p className="text-base text-muted-foreground">{config.description}</p>

      <div className="flex gap-2 mt-6">
          <Button onClick={handlePrimaryAction}>{config.primaryButton.label}</Button>
          <Button
            variant="outline"
            onClick={() => sonnerToast.dismiss(id)}
          >
            {config.dismissButton.label}
          </Button>
      </div>
    </div>
  );
}