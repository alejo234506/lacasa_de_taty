import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Ocupa todo el contenedor (que debe ser `relative`). */
  fill?: boolean;
  priority?: boolean;
  quality?: number;
};

const FILL: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

/** Imagen con carga diferida. */
export default function Image({ fill, priority, quality: _quality, sizes: _sizes, style, ...rest }: Props) {
  return (
    <img
      {...rest}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={fill ? { ...FILL, ...style } : style}
    />
  );
}
