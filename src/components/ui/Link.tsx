import type { AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Enlace interno (React Router) o externo, según `href`. */
export default function Link({ href, ...rest }: Props) {
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return <a href={href} {...rest} />;
  return <RouterLink to={href} {...rest} />;
}
