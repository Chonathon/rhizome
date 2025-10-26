'use client';

import React from 'react';
import { toast as sonnerToast } from 'sonner';

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
    <div className="flex rounded-lg bg-white shadow-lg ring-1 ring-black/5 w-full max-w-xl items-center justify-between p-4">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900">{config.title}</p>
        <p className="mt-1 text-sm text-gray-500">{config.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="rounded bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
          onClick={handlePrimaryAction}
        >
          {config.primaryButton.label}
        </button>
        <button
          className="rounded px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => sonnerToast.dismiss(id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}