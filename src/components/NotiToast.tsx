'use client';

import React from 'react';
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
}

const notificationConfigs: Record<NotificationType, NotiToastConfig> = {
  'alpha-feedback': {
    title: 'Help us improve!',
    description: 'Share your feedback to help shape the future of this product.',
    primaryButton: {
      label: 'Complete feedback form',
      href: '', // Will be provided when calling showNotiToast
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
      duration: Infinity, // Only dismiss when user clicks dismiss button
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
      window.open(config.primaryButton.href, '_blank', 'noopener,noreferrer');
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
      <h2 className="text-xl font-semibold">{config.title}</h2>
      <p className="text-base text-muted-foreground">{config.description}</p>

      <div className="flex gap-2 mt-6">
          <Button onClick={handlePrimaryAction}>Give Feedback</Button>
          <Button
            variant="outline"
            onClick={() => sonnerToast.dismiss(id)}
          >
            No thanks :C
          </Button>
      </div>
    </div>
  );
}