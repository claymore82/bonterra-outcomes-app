'use client';
import { usePathname } from 'next/navigation';
import {
  SideNav as StitchSideNav,
  SideNavItems,
  Divider,
  Text,
  Stack,
  type SideNavItem,
  type IconName,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';

const appNavItems: SideNavItem[] = [
  {
    activeIcon: 'house' as IconName,
    icon: 'house-outline' as IconName,
    label: 'Home',
    to: '/',
    isActive: false,
  },
  {
    activeIcon: 'sparkles' as IconName,
    icon: 'sparkles' as IconName,
    label: 'Intake Agent',
    to: '/intake',
    isActive: false,
  },
  {
    activeIcon: 'user' as IconName,
    icon: 'user' as IconName,
    label: 'Individuals',
    to: '/participants',
    isActive: false,
  },
  {
    activeIcon: 'user-plus' as IconName,
    icon: 'user-plus' as IconName,
    label: 'Families',
    to: '/families',
    isActive: false,
  },
  {
    activeIcon: 'user-plus' as IconName,
    icon: 'user-plus' as IconName,
    label: 'Enroll Existing',
    to: '/enroll',
    isActive: false,
  },
];

const adminNavItems: SideNavItem[] = [
  {
    activeIcon: 'cog' as IconName,
    icon: 'cog' as IconName,
    label: 'Administration',
    to: '/admin/settings',
    isActive: false,
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const { currentUser } = useUserStore();

  const isAdmin =
    currentUser?.role === 'program_manager' ||
    currentUser?.role === 'super_admin';

  const updatedAppNavItems = appNavItems.map((item) => ({
    ...item,
    isActive: pathname === item.to,
  }));

  const updatedAdminNavItems = adminNavItems.map((item) => ({
    ...item,
    isActive: pathname === item.to,
  }));

  return (
    <StitchSideNav>
      <Stack space="400">
        <SideNavItems navItems={updatedAppNavItems} />

        {isAdmin && (
          <>
            <div style={{ padding: '0 16px' }}>
              <Divider />
            </div>
            <SideNavItems navItems={updatedAdminNavItems} />
          </>
        )}
      </Stack>
    </StitchSideNav>
  );
}
