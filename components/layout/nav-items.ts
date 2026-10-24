import {
  CarFront,
  FileText,
  IndianRupee,
  LayoutDashboard,
  type LucideIcon,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from "lucide-react";

import { can, isAdmin, type Permission, type PermissionSubject } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Staff need this permission to see the item; admins always see it. */
  permission?: Permission;
  adminOnly?: boolean;
};

/** The eight sections from the spec, in sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applicants", label: "Applicants", icon: Users, permission: "view_applicants" },
  { href: "/payments", label: "Payments", icon: IndianRupee, permission: "view_financials" },
  { href: "/documents", label: "Documents", icon: FileText, permission: "view_applicants" },
  { href: "/training", label: "Training", icon: CarFront, permission: "view_applicants" },
  { href: "/staff", label: "Staff", icon: UserCog, adminOnly: true },
  { href: "/activity-logs", label: "Logs", icon: ScrollText, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Items shown in the mobile bottom bar before the "More" sheet, in priority order. */
export const MOBILE_PRIMARY_HREFS = ["/dashboard", "/applicants", "/training", "/payments"];

export function visibleNavItems(subject: PermissionSubject): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin(subject);
    if (item.permission) return can(subject, item.permission);
    return true;
  });
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitleFor(pathname: string): string {
  const item = NAV_ITEMS.find((i) => isActivePath(pathname, i.href));
  return item?.label ?? "";
}
