import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";

import "./FocusRail.css";

export type FocusRailItem = {
  id: string;
  title: string;
  description?: string;
  imageSrc: string;
  meta?: string;
};

function wrap(min: number, max: number, value: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

export default function FocusRail({
  items,
  initialIndex = 0,
  loop = true,
  autoPlay = false,
  interval = 4200,
  onExplore,
  onOpen,
}: {
  items: FocusRailItem[];
  initialIndex?: number;
  loop?: boolean;
  autoPlay?: boolean;
  interval?: number;
  onExplore?: (item: FocusRailItem) => void;
  onOpen?: (item: FocusRailItem) => void;
}) {
  const [active, setActive] = useState(initialIndex);
  const [hovering, setHovering] = useState(false);
  const lastWheelAtRef = useRef(0);
  const count = items.length;
  const activeIndex = count ? wrap(0, count, active) : 0;
  const activeItem = items[activeIndex];

  const visibleOffsets = useMemo(() => [-2, -1, 0, 1, 2], []);

  const previous = useCallback(() => {
    if (!count) return;
    if (!loop && active <= 0) return;
    setActive((value) => value - 1);
  }, [active, count, loop]);

  const next = useCallback(() => {
    if (!count) return;
    if (!loop && active >= count - 1) return;
    setActive((value) => value + 1);
  }, [active, count, loop]);

  useEffect(() => {
    if (!autoPlay || hovering || count < 2) return undefined;
    const timer = window.setInterval(next, interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, count, hovering, interval, next]);

  if (!count || !activeItem) {
    return null;
  }

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelAtRef.current < 380) return;
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (Math.abs(delta) < 18) return;
    event.preventDefault();
    if (delta > 0) next();
    else previous();
    lastWheelAtRef.current = now;
  };

  const onDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const power = Math.abs(info.offset.x) * info.velocity.x;
    if (power < -1800 || info.offset.x < -70) next();
    if (power > 1800 || info.offset.x > 70) previous();
  };

  return (
    <section
      className="focus-rail"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onWheel={onWheel}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") previous();
        if (event.key === "ArrowRight") next();
      }}
    >
      <div className="focus-rail-ambience" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeItem.id}
            src={activeItem.imageSrc}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.34 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            loading="lazy"
          />
        </AnimatePresence>
      </div>

      <motion.div
        className="focus-rail-stage"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={onDragEnd}
      >
        {visibleOffsets.map((offset) => {
          const absoluteIndex = active + offset;
          if (!loop && (absoluteIndex < 0 || absoluteIndex >= count)) return null;
          const item = items[wrap(0, count, absoluteIndex)];
          const isCenter = offset === 0;
          const distance = Math.abs(offset);
          return (
            <motion.button
              className={`focus-rail-card ${isCenter ? "is-center" : ""}`}
              data-listing-id={item.id}
              key={`${item.id}-${offset}`}
              type="button"
              initial={false}
              animate={{
                x: offset * 260,
                scale: isCenter ? 1 : 0.84,
                rotateY: offset * -14,
                opacity: isCenter ? 1 : Math.max(0.16, 1 - distance * 0.34),
                zIndex: 20 - distance,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={() => {
                if (isCenter) onOpen?.(item);
                else setActive((value) => value + offset);
              }}
            >
              <img src={item.imageSrc} alt="" loading="lazy" />
              <span>{item.meta}</span>
              <strong>{item.title}</strong>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="focus-rail-info">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeItem.meta && <span>{activeItem.meta}</span>}
            <h2>{activeItem.title}</h2>
            {activeItem.description && <p>{activeItem.description}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="focus-rail-actions">
          <button type="button" onClick={previous} aria-label="Previous listing">
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <small>
            {activeIndex + 1} / {count}
          </small>
          <button type="button" onClick={next} aria-label="Next listing">
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          <button
            className="focus-rail-explore"
            data-module-key="marketplace"
            type="button"
            onClick={() => onExplore?.(activeItem)}
          >
            Explore
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
