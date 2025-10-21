'use client';
import { usePathname } from 'next/navigation';
import {
  SideNav as StitchSideNav,
  SideNavItems,
  type SideNavItem,
  type IconName,
} from '@bonterratech/stitch-extension';

const navItems: SideNavItem[] = [
  {
    activeIcon: 'house' as IconName,
    icon: 'house-outline' as IconName,
    label: 'Home',
    to: '/',
    isActive: false,
  },
  {
    activeIcon: 'paper-plane' as IconName,
    icon: 'paper-plane-outline' as IconName,
    label: 'Quick Start',
    to: '/quick-start',
    isActive: false,
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const updatedNavItems = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.to,
  }));
  return (
    <StitchSideNav>
      <SideNavItems navItems={updatedNavItems} />
    </StitchSideNav>
  );
}
