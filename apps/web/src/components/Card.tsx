import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
}

export default function Card({ children, onClick, className = '', interactive = false }: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        interactive || onClick ? 'card-interactive' : 'card',
        'p-4',
        className
      )}
    >
      {children}
    </Component>
  );
}
