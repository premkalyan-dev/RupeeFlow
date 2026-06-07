import { useEffect, useRef, useState } from 'react';
import { AD_SLOTS, AdSlotId } from '../ads.ts';

interface AdUnitProps {
  slotId: AdSlotId;
  visibility: 'desktop' | 'mobile' | 'both';
  className?: string;
}

const visibilityClass = {
  desktop: 'hidden md:flex',
  mobile: 'flex md:hidden',
  both: 'flex',
} as const;

const isPlaceholderKey = (key: string) => key.startsWith('REPLACE_WITH_');

const getFrameShell = () => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: transparent;
      }
      iframe, img, ins {
        max-width: 100% !important;
      }
    </style>
  </head>
  <body></body>
</html>
`;

const AdUnit = ({ slotId, visibility, className = '' }: AdUnitProps) => {
  const slot = AD_SLOTS[slotId];
  const rootRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const hasLoadedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || isVisible) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: '160px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!slot || !isVisible || hasLoadedRef.current || isPlaceholderKey(slot.key)) return;

    const frame = frameRef.current;
    const frameDocument = frame?.contentDocument;
    if (!frame || !frameDocument) return;

    hasLoadedRef.current = true;

    frameDocument.open();
    frameDocument.write(getFrameShell());
    frameDocument.close();

    const configScript = frameDocument.createElement('script');
    configScript.type = 'text/javascript';
    configScript.text = `
      window.atOptions = {
        key: '${slot.key}',
        format: 'iframe',
        height: ${slot.height},
        width: ${slot.width},
        params: {}
      };
    `;

    const invokeScript = frameDocument.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.async = true;
    invokeScript.src = slot.scriptSrc;
    invokeScript.onerror = () => {
      setHasFailed(true);
    };

    frameDocument.body.appendChild(configScript);
    frameDocument.body.appendChild(invokeScript);
  }, [isVisible, slot]);

  if (!slot) return null;

  const shouldShowPlaceholder = hasFailed || isPlaceholderKey(slot.key) || !isVisible;

  return (
    <aside
      ref={rootRef}
      aria-label="Advertisement"
      data-ad-slot={slot.id}
      className={`${visibilityClass[visibility]} w-full justify-center ${className}`}
    >
      <div
        className="ad-reserved-slot border border-dashed border-slate-200 dark:border-slate-800 gold:border-[#D4AF37]/30 bg-white/60 dark:bg-slate-900/45 gold:bg-[#111827] rounded-[20px] overflow-hidden text-center"
        style={{
          width: slot.width,
          height: slot.height,
          maxWidth: '100%',
        }}
      >
        {shouldShowPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-[10px] uppercase tracking-widest font-bold text-slate-300 dark:text-slate-700 gold:text-[#D4AF37]/45 pointer-events-none">
            Advertisement
          </div>
        )}
        <iframe
          ref={frameRef}
          title={`Advertisement ${slot.id}`}
          width={slot.width}
          height={slot.height}
          loading="lazy"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="block border-0"
          style={{
            width: slot.width,
            height: slot.height,
            maxWidth: '100%',
            opacity: shouldShowPlaceholder ? 0 : 1,
          }}
        />
      </div>
    </aside>
  );
};

export default AdUnit;
