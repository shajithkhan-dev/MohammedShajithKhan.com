// LogoLoop.js — CDN-friendly version (no build tools, no JSX, no react-icons)
// Uses Framer Motion scroll velocity for scroll-driven speed boost.

(function () {

const {
  useCallback, useEffect, useMemo, useRef, useState, memo, createElement: h
} = React;

const {
  useScroll, useVelocity, useTransform, useSpring, useAnimationFrame, useMotionValue, motion
} = FramerMotion;

const ANIMATION_CONFIG = { MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = value => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }
    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => observers.forEach(o => o && o.disconnect());
  }, [callback, elements, dependencies]);
};

const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const images = seqRef.current ? seqRef.current.querySelectorAll('img') : [];
    if (images.length === 0) { onLoad(); return; }
    let remaining = images.length;
    const handle = () => { if (--remaining === 0) onLoad(); };
    images.forEach(img => {
      if (img.complete) handle();
      else {
        img.addEventListener('load', handle, { once: true });
        img.addEventListener('error', handle, { once: true });
      }
    });
    return () => images.forEach(img => {
      img.removeEventListener('load', handle);
      img.removeEventListener('error', handle);
    });
  }, [onLoad, seqRef, dependencies]);
};

const LogoLoop = memo(({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  pauseOnHover,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  renderItem,
  ariaLabel = 'Partner logos',
  className,
  style
}) => {
  const containerRef = useRef(null);
  const seqRef = useRef(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion scroll velocity
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  // Base direction: left = negative offset growth
  const baseSpeed = direction === 'left' ? speed : -speed;

  const x = useMotionValue(0);

  useAnimationFrame((t, delta) => {
    if (isHovered) return;
    if (seqWidth === 0) return;

    const vFactor = velocityFactor.get();
    // scroll velocity boosts in the scroll direction; abs keeps it additive
    const scrollBoost = Math.abs(vFactor) * Math.sign(vFactor);
    const effectiveSpeed = baseSpeed + scrollBoost * baseSpeed * 0.5;

    let next = x.get() - (effectiveSpeed * delta) / 1000;
    // wrap around the single sequence width
    next = wrap(-seqWidth, 0, next);
    x.set(next);
  });

  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current ? containerRef.current.clientWidth : 0;
    const seqRect = seqRef.current ? seqRef.current.getBoundingClientRect() : null;
    const sw = seqRect ? seqRect.width : 0;
    if (sw > 0) {
      setSeqWidth(Math.ceil(sw));
      const copies = Math.ceil(containerWidth / sw) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
    }
  }, []);

  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);

  const cssVariables = useMemo(() => {
    const vars = {
      '--logoloop-gap': `${gap}px`,
      '--logoloop-logoHeight': `${logoHeight}px`
    };
    if (fadeOutColor) vars['--logoloop-fadeColor'] = fadeOutColor;
    return vars;
  }, [gap, logoHeight, fadeOutColor]);

  const rootClassName = useMemo(() =>
    ['logoloop', 'logoloop--horizontal',
      fadeOut && 'logoloop--fade',
      scaleOnHover && 'logoloop--scale-hover',
      className
    ].filter(Boolean).join(' '),
    [fadeOut, scaleOnHover, className]
  );

  const renderLogoItem = useCallback((item, key) => {
    if (renderItem) {
      return h('li', { className: 'logoloop__item', key, role: 'listitem' }, renderItem(item, key));
    }
    const isNodeItem = 'node' in item;
    const content = isNodeItem
      ? h('span', { className: 'logoloop__node', 'aria-hidden': !!(item.href && !item.ariaLabel) }, item.node)
      : h('img', {
          src: item.src, srcSet: item.srcSet, sizes: item.sizes,
          width: item.width, height: item.height,
          alt: item.alt || '', title: item.title,
          loading: 'lazy', decoding: 'async', draggable: false
        });

    const itemAriaLabel = isNodeItem ? (item.ariaLabel || item.title) : (item.alt || item.title);
    const itemContent = item.href
      ? h('a', { className: 'logoloop__link', href: item.href,
          'aria-label': itemAriaLabel || 'logo link', target: '_blank', rel: 'noreferrer noopener'
        }, content)
      : content;

    return h('li', { className: 'logoloop__item', key, role: 'listitem' }, itemContent);
  }, [renderItem]);

  const logoLists = useMemo(() =>
    Array.from({ length: copyCount }, (_, copyIndex) =>
      h('ul', {
        className: 'logoloop__list',
        key: `copy-${copyIndex}`,
        role: 'list',
        'aria-hidden': copyIndex > 0,
        ref: copyIndex === 0 ? seqRef : undefined
      }, logos.map((item, i) => renderLogoItem(item, `${copyIndex}-${i}`)))
    ),
    [copyCount, logos, renderLogoItem]
  );

  const containerStyle = useMemo(() => ({
    width: toCssLength(width) || '100%',
    ...cssVariables,
    ...style
  }), [width, cssVariables, style]);

  return h('div', {
    ref: containerRef,
    className: rootClassName,
    style: containerStyle,
    role: 'region',
    'aria-label': ariaLabel
  },
    h(motion.div, {
      className: 'logoloop__track',
      style: { x },
      onMouseEnter: () => { if (pauseOnHover) setIsHovered(true); },
      onMouseLeave: () => { if (pauseOnHover) setIsHovered(false); }
    }, logoLists)
  );
});

LogoLoop.displayName = 'LogoLoop';
window.LogoLoop = LogoLoop;

})();
