import { ReactNode } from 'react';
import { DrawerShell, DrawerSize } from '@/components/containers/DrawerShell';
import { DrawerHeader } from '@/components/containers/DrawerHeader';

interface ObjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: DrawerSize;
}

export function ObjectDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
}: ObjectDrawerProps) {
  return (
    <DrawerShell
      open={open}
      onClose={() => onOpenChange(false)}
      size={size}
      className={className}
      header={
        <DrawerHeader
          title={title}
          description={description}
          onClose={() => onOpenChange(false)}
        />
      }
    >
      {children}
    </DrawerShell>
  );
}
