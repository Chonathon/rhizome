import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string;
    /** Rendered instead of the image when there's no src or the load fails. */
    fallback?: ReactNode;
    /** Classes for the wrapping element (sizing/shape/clipping usually goes here). */
    containerClassName?: string;
    skeletonClassName?: string;
    /** Pulse placeholder shown while the image is loading. Defaults to true. */
    showSkeleton?: boolean;
}

/**
 * Drop-in replacement for <img> that shows a pulse skeleton while loading and
 * a caller-supplied fallback (e.g. an initial letter) if there's no src or the
 * image fails to load, instead of a blank box or the browser's broken-image icon.
 */
export function ImageWithFallback({
    src,
    alt,
    className,
    containerClassName,
    skeletonClassName,
    fallback = null,
    showSkeleton = true,
    loading = 'lazy',
    onLoad,
    onError,
    ...imgProps
}: ImageWithFallbackProps) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');

    // Reset when the source changes so a new URL gets its own loading/error cycle.
    useEffect(() => {
        setStatus(src ? 'loading' : 'error');
    }, [src]);

    if (status === 'error') {
        return <>{fallback}</>;
    }

    return (
        <span className={cn('relative inline-block', containerClassName)}>
            {status === 'loading' && showSkeleton && (
                <span
                    aria-hidden="true"
                    // bg-muted is too close to the card background to survive the pulse's
                    // 50%-opacity trough; muted-foreground at low alpha stays visible in both themes.
                    className={cn('absolute inset-0 animate-pulse bg-muted-foreground/20', skeletonClassName)}
                />
            )}
            <img
                src={src}
                alt={alt}
                loading={loading}
                className={cn(
                    'transition-opacity duration-200',
                    status === 'loading' ? 'opacity-0' : 'opacity-100',
                    className,
                )}
                onLoad={(e) => {
                    setStatus('loaded');
                    onLoad?.(e);
                }}
                onError={(e) => {
                    setStatus('error');
                    onError?.(e);
                }}
                {...imgProps}
            />
        </span>
    );
}

export default ImageWithFallback;
