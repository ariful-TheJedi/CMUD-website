import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  GraduationCap,
  Users,
  Image as ImageIcon,
  BookOpen,
  Bell,
  Calendar,
  CalendarClock,
  MessageSquare,
  HelpCircle,
  Inbox,
  ShieldCheck,
  UserCog,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import type { CurrentUserInfo } from "@/lib/admin-access.functions";
import { canViewSection } from "@/lib/content-access.shared";
import type { ContentSection } from "@/lib/content-access.shared";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: ContentSection;
  adminOnly?: boolean;
};

const CONTENT_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, section: "dashboard" },
  { title: "Traffic", url: "/admin/traffic", icon: Activity, section: "traffic" },
  { title: "Home Page", url: "/admin/home-page", icon: Home, section: "home_page" },
  { title: "Courses", url: "/admin/courses", icon: GraduationCap, section: "courses" },
  { title: "Faculty", url: "/admin/faculty", icon: Users, section: "faculty" },
  { title: "Gallery", url: "/admin/gallery", icon: ImageIcon, section: "gallery" },
  { title: "Education Aides", url: "/admin/education-aides", icon: BookOpen, section: "education_aides" },
  { title: "Notices", url: "/admin/notices", icon: Bell, section: "notices" },
  { title: "Routines", url: "/admin/routines", icon: CalendarClock, section: "routines" },
  { title: "Events", url: "/admin/events", icon: Calendar, section: "events" },
  { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquare, section: "testimonials" },
  { title: "FAQs", url: "/admin/faqs", icon: HelpCircle, section: "faqs" },
  { title: "Admissions", url: "/admin/admissions", icon: Inbox, section: "admissions" },
  { title: "Certificates", url: "/admin/certificate-check", icon: ShieldCheck, section: "certificates" },
];

const ADMIN_ITEMS: NavItem[] = [
  { title: "Users", url: "/admin/users", icon: UserCog, adminOnly: true },
  { title: "Settings", url: "/admin/settings", icon: Settings, adminOnly: true },
];

export function AdminSidebar({ currentUser }: { currentUser: CurrentUserInfo | undefined }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = !!currentUser?.isAdministrator;

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await authClient.signOut();
    toast.success("Signed out");
    navigate({ to: "/admin/login", replace: true });
  };

  const isActive = (url: string) =>
    pathname === url || (url !== "/admin/dashboard" && pathname.startsWith(url));

  const visibleContent = CONTENT_ITEMS.filter((item) => {
    if (!item.section) return isAdmin;
    if (item.section === "traffic") {
      return (
        canViewSection(currentUser, "traffic") || canViewSection(currentUser, "dashboard")
      );
    }
    return canViewSection(currentUser, item.section);
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">CMUD Admin</div>
        {currentUser ? (
          <div className="text-xs text-muted-foreground truncate">
            {currentUser.email}
            <span className="ml-1 max-w-[10rem] truncate rounded bg-muted px-1.5 py-0.5 text-[10px]">
              {currentUser.roleLabel || (currentUser.isAdministrator ? "admin" : "staff")}
            </span>
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleContent.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url as string} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url as string} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
