import React from 'react';
import { cn } from '@/lib/utils';

export type IconName =
  | 'star'
  | 'check-circle'
  | 'arrow-right'
  | 'arrow-left'
  | 'map-pin'
  | 'shield-check'
  | 'phone'
  | 'mail'
  | 'external-link'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'sparkles'
  | 'home'
  | 'building'
  | 'clipboard-check'
  | 'wrench'
  | 'sun'
  | 'hammer'
  | 'arrow-up-right'
  | 'shield'
  | 'lock'
  | 'award'
  | 'calculator'
  | 'badge-percent'
  | 'camera'
  | 'file-text'
  | 'users'
  | 'help-circle'
  | 'clock'
  | 'menu'
  | 'x'
  | 'google'
  | 'yelp'
  | 'facebook'
  | 'instagram'
  | 'scale'
  | 'alert-triangle'
  | 'layers'
  | 'dollar-sign'
  | 'search'
  | 'quote'
  | 'briefcase'
  | 'heart'
  | 'eye'
  | 'cloud-rain'
  | 'calendar'
  | 'loader';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
}

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      className={cn('inline-block shrink-0', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <use href={`/sprite.svg#icon-${name}`} xlinkHref={`/sprite.svg#icon-${name}`} />
    </svg>
  );
}

// Convenient drop-in aliases
export function StarIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="star" {...props} />;
}

export function CheckCircleIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="check-circle" {...props} />;
}

export function ArrowRightIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="arrow-right" {...props} />;
}

export function MapPinIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="map-pin" {...props} />;
}

export function ShieldCheckIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="shield-check" {...props} />;
}

export function PhoneIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="phone" {...props} />;
}

export function GoogleIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="google" {...props} />;
}

export function YelpIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="yelp" {...props} />;
}
