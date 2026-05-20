import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import "./DomeGallery.css";

type ImageItem = string | { src: string; alt?: string };

type DomeGalleryProps = {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: "auto" | "min" | "max" | "width" | "height";
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
};

type ItemDef = {
  src: string;
  alt: string;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
};

const DEFAULT_IMAGES: ImageItem[] = ["/everythingutm-icon.png"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const normalizeAngle = (degrees: number) => ((degrees % 360) + 360) % 360;
const wrapAngleSigned = (degrees: number) => {
  const angle = (((degrees + 180) % 360) + 360) % 360;
  return angle - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const value = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(value) ? value : fallback;
};

function buildItems(pool: ImageItem[], segments: number): ItemDef[] {
  const xCols = Array.from({ length: segments }, (_, index) => -37 + index * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, column) => {
    const ys = column % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  if (pool.length === 0) {
    return coords.map((coord) => ({ ...coord, src: "", alt: "" }));
  }

  const normalizedImages = pool.map((image) =>
    typeof image === "string"
      ? { src: image, alt: "" }
      : { src: image.src || "", alt: image.alt || "" },
  );
  const usedImages = Array.from(
    { length: coords.length },
    (_, index) => normalizedImages[index % normalizedImages.length],
  );

  for (let index = 1; index < usedImages.length; index += 1) {
    if (usedImages[index].src === usedImages[index - 1].src) {
      for (let swap = index + 1; swap < usedImages.length; swap += 1) {
        if (usedImages[swap].src !== usedImages[index].src) {
          const current = usedImages[index];
          usedImages[index] = usedImages[swap];
          usedImages[swap] = current;
          break;
        }
      }
    }
  }

  return coords.map((coord, index) => ({
    ...coord,
    src: usedImages[index].src,
    alt: usedImages[index].alt,
  }));
}

function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number,
) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = "auto",
  minRadius = 420,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "#120F17",
  maxVerticalRotationDeg = 5,
  dragSensitivity = 20,
  enlargeTransitionMs = 300,
  segments = 35,
  dragDampening = 2,
  openedImageWidth = "400px",
  openedImageHeight = "400px",
  imageBorderRadius = "24px",
  openedImageBorderRadius = "24px",
  grayscale = false,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLElement | null>(null);
  const originalTilePositionRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = useCallback((xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const width = Math.max(1, cr.width);
      const height = Math.max(1, cr.height);
      const minDim = Math.min(width, height);
      const maxDim = Math.max(width, height);
      const aspect = width / height;
      let basis: number;
      switch (fitBasis) {
        case "min":
          basis = minDim;
          break;
        case "max":
          basis = maxDim;
          break;
        case "width":
          basis = width;
          break;
        case "height":
          basis = height;
          break;
        default:
          basis = aspect >= 1.3 ? width : minDim;
      }
      let radius = basis * fit;
      radius = Math.min(radius, height * 1.35);
      radius = clamp(radius, minRadius, maxRadius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${Math.round(radius)}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      root.style.setProperty("--tile-radius", imageBorderRadius);
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [
    applyTransform,
    fit,
    fitBasis,
    grayscale,
    imageBorderRadius,
    maxRadius,
    minRadius,
    openedImageBorderRadius,
    overlayBlurColor,
    padFactor,
  ]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const maxVelocity = 1.4;
      let vX = clamp(vx, -maxVelocity, maxVelocity) * 80;
      let vY = clamp(vy, -maxVelocity, maxVelocity) * 80;
      let frames = 0;
      const dampening = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * dampening;
      const stopThreshold = 0.015 - 0.01 * dampening;
      const maxFrames = Math.round(90 + 270 * dampening);

      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (
          (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) ||
          ++frames > maxFrames
        ) {
          inertiaRAF.current = null;
          return;
        }
        const nextX = clamp(
          rotationRef.current.x - vY / 200,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        );
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [applyTransform, dragDampening, maxVerticalRotationDeg, stopInertia],
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();
        const evt = event as PointerEvent;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;

        const evt = event as PointerEvent;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;

        if (!movedRef.current && dxTotal * dxTotal + dyTotal * dyTotal > 16) {
          movedRef.current = true;
        }

        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        );
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);

        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);

        if (last) {
          draggingRef.current = false;
          const [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (
            Math.abs(vx) < 0.001 &&
            Math.abs(vy) < 0.001 &&
            Array.isArray(movement)
          ) {
            const [mx, my] = movement;
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
            startInertia(vx, vy);
          }
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: mainRef, eventOptions: { passive: true } },
  );

  const openItemFromElement = useCallback(
    (el: HTMLElement) => {
      if (openingRef.current) return;
      openingRef.current = true;
      openStartedAtRef.current = performance.now();

      const parent = el.parentElement as HTMLElement;
      focusedElRef.current = el;
      el.setAttribute("data-focused", "true");

      const offsetX = getDataNumber(parent, "offsetX", 0);
      const offsetY = getDataNumber(parent, "offsetY", 0);
      const sizeX = getDataNumber(parent, "sizeX", 2);
      const sizeY = getDataNumber(parent, "sizeY", 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - rotationRef.current.x;
      parent.style.setProperty("--rot-y-delta", `${rotY}deg`);
      parent.style.setProperty("--rot-x-delta", `${rotX}deg`);

      const refDiv = document.createElement("div");
      refDiv.className = "dg-item__image dg-item__image--reference";
      refDiv.style.opacity = "0";
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);
      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();
      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        return;
      }

      originalTilePositionRef.current = {
        left: tileR.left,
        top: tileR.top,
        width: tileR.width,
        height: tileR.height,
      };

      el.style.visibility = "hidden";
      const overlay = document.createElement("div");
      overlay.className = "dg-enlarge";
      overlay.style.position = "absolute";
      overlay.style.left = `${frameR.left - mainR.left}px`;
      overlay.style.top = `${frameR.top - mainR.top}px`;
      overlay.style.width = `${frameR.width}px`;
      overlay.style.height = `${frameR.height}px`;
      overlay.style.opacity = "0";
      overlay.style.zIndex = "30";
      overlay.style.transformOrigin = "top left";
      overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;

      const img = document.createElement("img");
      img.src = parent.dataset.src || (el.querySelector("img") as HTMLImageElement)?.src || "";
      overlay.appendChild(img);
      viewerRef.current?.appendChild(overlay);

      overlay.style.transform = `translate(${tileR.left - frameR.left}px, ${
        tileR.top - frameR.top
      }px) scale(${tileR.width / frameR.width}, ${tileR.height / frameR.height})`;

      window.setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = "1";
        overlay.style.transform = "translate(0px, 0px) scale(1, 1)";
        rootRef.current?.setAttribute("data-enlarging", "true");
      }, 16);

      if (openedImageWidth || openedImageHeight) {
        const onFirstEnd = (event: TransitionEvent) => {
          if (event.propertyName !== "transform") return;
          overlay.removeEventListener("transitionend", onFirstEnd);
          const tempWidth = openedImageWidth || `${frameR.width}px`;
          const tempHeight = openedImageHeight || `${frameR.height}px`;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
          overlay.style.left = `${frameR.left - mainR.left + (frameR.width - parseFloat(tempWidth)) / 2}px`;
          overlay.style.top = `${frameR.top - mainR.top + (frameR.height - parseFloat(tempHeight)) / 2}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
        };
        overlay.addEventListener("transitionend", onFirstEnd);
      }
    },
    [enlargeTransitionMs, openedImageHeight, openedImageWidth, segments],
  );

  const onTileClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (
        draggingRef.current ||
        movedRef.current ||
        performance.now() - lastDragEndAt.current < 80 ||
        openingRef.current
      ) {
        return;
      }
      openItemFromElement(event.currentTarget);
    },
    [openItemFromElement],
  );

  const onTilePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch") return;
      if (
        draggingRef.current ||
        movedRef.current ||
        performance.now() - lastDragEndAt.current < 80 ||
        openingRef.current
      ) {
        return;
      }
      openItemFromElement(event.currentTarget);
    },
    [openItemFromElement],
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return undefined;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      const overlay = viewerRef.current?.querySelector(".dg-enlarge") as HTMLElement | null;
      if (!el || !overlay) return;
      const parent = el.parentElement as HTMLElement;
      const refDiv = parent.querySelector(".dg-item__image--reference");
      overlay.remove();
      refDiv?.remove();
      parent.style.setProperty("--rot-y-delta", "0deg");
      parent.style.setProperty("--rot-x-delta", "0deg");
      el.style.visibility = "";
      focusedElRef.current = null;
      originalTilePositionRef.current = null;
      rootRef.current?.removeAttribute("data-enlarging");
      openingRef.current = false;
    };
    scrim.addEventListener("click", close);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      scrim.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="dg-sphere-root"
      style={
        {
          "--segments-x": segments,
          "--segments-y": segments,
          "--overlay-blur-color": overlayBlurColor,
          "--tile-radius": imageBorderRadius,
          "--enlarge-radius": openedImageBorderRadius,
          "--image-filter": grayscale ? "grayscale(1)" : "none",
        } as React.CSSProperties
      }
    >
      <main ref={mainRef} className="dg-sphere-main">
        <div className="dg-stage">
          <div ref={sphereRef} className="dg-sphere">
            {items.map((item, index) => (
              <div
                key={`${item.x},${item.y},${index}`}
                className="dg-item"
                data-src={item.src}
                data-offset-x={item.x}
                data-offset-y={item.y}
                data-size-x={item.sizeX}
                data-size-y={item.sizeY}
                style={
                  {
                    "--offset-x": item.x,
                    "--offset-y": item.y,
                    "--item-size-x": item.sizeX,
                    "--item-size-y": item.sizeY,
                  } as React.CSSProperties
                }
              >
                <div
                  className="dg-item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={item.alt || "Open image"}
                  onClick={onTileClick}
                  onPointerUp={onTilePointerUp}
                >
                  <img src={item.src} draggable={false} alt={item.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dg-overlay" />
        <div className="dg-overlay dg-overlay--blur" />
        <div className="dg-edge-fade dg-edge-fade--top" />
        <div className="dg-edge-fade dg-edge-fade--bottom" />
        <div className="dg-viewer" ref={viewerRef}>
          <div ref={scrimRef} className="dg-scrim" />
          <div ref={frameRef} className="dg-frame" />
        </div>
      </main>
    </div>
  );
}
