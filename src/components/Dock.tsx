import {
  AnimatePresence,
  motion,
  type MotionValue,
  type SpringOptions,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./Dock.css";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  moduleKey?: string;
  previewUrl?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  moduleKey?: string;
  previewUrl?: string;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = "",
  onClick,
  moduleKey,
  previewUrl,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (value) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return value - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`rb-dock-item ${className}`}
      data-module-key={moduleKey}
      data-preview-url={previewUrl}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, {
              isHovered,
            })
          : child,
      )}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return undefined;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`rb-dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }: { className?: string; children: React.ReactNode }) {
  return <div className={`rb-dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 62,
  distance = 180,
  panelHeight = 64,
  dockHeight = 160,
  baseItemSize = 46,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(pointer: coarse)");
    if (!query) return undefined;
    const update = () => setIsCoarsePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight],
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{ height: isCoarsePointer ? panelHeight : height, scrollbarWidth: "none" }}
      className="rb-dock-outer"
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          if (isCoarsePointer) return;
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`rb-dock-panel ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="EverythingUTM dashboard dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            moduleKey={item.moduleKey}
            previewUrl={item.previewUrl}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <span className="rb-dock-inline-label">{item.label}</span>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
