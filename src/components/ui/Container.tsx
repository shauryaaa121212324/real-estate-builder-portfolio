import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerOwnProps<T extends ElementType = 'div'> {
  /** HTML element or component to render as. Default: 'div'. */
  as?: T;
  /** Max-width preset. Default: 'xl' (matches max-w-7xl from Navbar). */
  size?: ContainerSize;
  children: ReactNode;
  className?: string;
}

type ContainerProps<T extends ElementType = 'div'> = ContainerOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>;

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm:   'max-w-3xl',
  md:   'max-w-5xl',
  lg:   'max-w-6xl',
  xl:   'max-w-7xl',    // primary — matches Navbar's mx-auto max-w-7xl
  full: 'max-w-full',
};

// Horizontal padding mirrors the Navbar: px-4 sm:px-6 lg:px-10
const PADDING = 'px-4 sm:px-6 lg:px-10';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Container<T extends ElementType = 'div'>({
  as,
  size = 'xl',
  children,
  className = '',
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? 'div') as ElementType;

  const classes = [
    'mx-auto w-full',
    SIZE_CLASSES[size],
    PADDING,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Container;