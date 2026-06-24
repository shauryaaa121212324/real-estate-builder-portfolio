import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold';
type ButtonSize   = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Append a right-arrow glyph that nudges on hover. */
  withArrow?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonBaseProps> & {
    as?: 'button';
    href?: never;
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonBaseProps> & {
    as: 'a';
    href: string;
  };

// `as="link"` renders React Router's <Link> for internal SPA navigation —
// use this instead of `as="a"` whenever `href`/`to` points at an in-app
// route, so navigation goes through client-side routing (no full page
// reload) and the browser history stack behaves normally.
type ButtonAsLink = ButtonBaseProps &
  Omit<LinkProps, keyof ButtonBaseProps> & {
    as: 'link';
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#F8F6F1] text-[#1B1B1B] border border-transparent ' +
    'hover:bg-white active:scale-[0.97]',
  secondary:
    'bg-transparent text-[#F8F6F1] border border-[#F8F6F1]/30 ' +
    'hover:border-[#C9A227] hover:bg-[#C9A227]/10 active:scale-[0.97]',
  ghost:
    'bg-transparent text-[#1B1B1B] border border-[#1B1B1B]/15 ' +
    'hover:border-[#1B1B1B] hover:bg-[#1B1B1B] hover:text-[#F8F6F1] active:scale-[0.97]',
  gold:
    'bg-[#C9A227] text-[#14130F] border border-transparent ' +
    'hover:bg-[#b8911f] active:scale-[0.97]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-5  py-2.5 text-[11px]   tracking-[0.16em]',
  md: 'px-8  py-3.5 text-[12px]   tracking-[0.14em]',
  lg: 'px-10 py-4   text-[12.5px] tracking-[0.14em]',
};

const BASE =
  'group inline-flex items-center justify-center rounded-full uppercase ' +
  'font-sans transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
  'hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-40 select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60';

// ---------------------------------------------------------------------------
// Inner content
// ---------------------------------------------------------------------------

function Inner({
  children,
  isLoading,
  withArrow,
}: {
  children: ReactNode;
  isLoading: boolean;
  withArrow: boolean;
}) {
  return (
    <>
      {isLoading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        children
      )}
      {withArrow && !isLoading && (
        <span
          aria-hidden="true"
          className="ml-2.5 inline-block transition-transform duration-500 group-hover:translate-x-1"
        >
          &rarr;
        </span>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    withArrow = false,
    isLoading = false,
    children,
    className = '',
    as,
    ...rest
  } = props;

  const classes = [BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <Inner isLoading={isLoading} withArrow={withArrow}>
      {children}
    </Inner>
  );

  if (as === 'a') {
    const anchorProps = rest as Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonBaseProps>;
    return (
      <a className={classes} {...anchorProps}>
        {inner}
      </a>
    );
  }

  if (as === 'link') {
    const linkProps = rest as Omit<LinkProps, keyof ButtonBaseProps>;
    return (
      <Link className={classes} {...linkProps}>
        {inner}
      </Link>
    );
  }

  const buttonProps = rest as Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonBaseProps>;
  return (
    <button
      type="button"
      disabled={isLoading || buttonProps.disabled}
      className={classes}
      {...buttonProps}
    >
      {inner}
    </button>
  );
}

export default Button;