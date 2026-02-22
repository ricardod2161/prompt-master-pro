import { NavLink, useLocation } from "react-router-dom";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDeveloper } from "@/hooks/useIsDeveloper";
import { useSidebarStats } from "@/hooks/useSidebarStats";
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
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  Package,
  MessageSquare,
  Truck,
  QrCode,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  ShieldAlert,
  Megaphone,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { SidebarBadge } from "./SidebarBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BadgeConfig = {
  key: string;
  variant: "default" | "warning" | "danger" | "success";
  pulse?: boolean;
};

const menuItems = [
  {
    group: "Principal",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "PDV", url: "/pos", icon: ShoppingCart },
      { 
        title: "KDS", 
        url: "/kds", 
        icon: ChefHat,
        badge: { key: "preparingOrders", variant: "warning", pulse: true } as BadgeConfig,
        tooltip: "Pedidos em preparo"
      },
      { 
        title: "Pedidos", 
        url: "/orders", 
        icon: ClipboardList,
        badge: { key: "pendingOrders", variant: "danger", pulse: true } as BadgeConfig,
        tooltip: "Pedidos pendentes"
      },
    ],
  },
  {
    group: "Gestão",
    icon: UtensilsCrossed,
    items: [
      { title: "Cardápio", url: "/menu", icon: UtensilsCrossed },
      { 
        title: "Estoque", 
        url: "/inventory", 
        icon: Package,
        badge: { key: "lowStockItems", variant: "warning" } as BadgeConfig,
        tooltip: "Itens com estoque baixo"
      },
      { 
        title: "Mesas", 
        url: "/tables", 
        icon: QrCode,
        badge: { key: "openTables", variant: "default" } as BadgeConfig,
        tooltip: "Mesas ocupadas"
      },
    ],
  },
  {
    group: "Operacional",
    icon: Truck,
    items: [
      { title: "Delivery", url: "/delivery", icon: Truck },
      { title: "Caixa", url: "/cashier", icon: Wallet },
      { title: "WhatsApp", url: "/whatsapp/chat", icon: MessageSquare },
    ],
  },
  {
    group: "Análises",
    icon: BarChart3,
    items: [
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Marketing", url: "/marketing", icon: Megaphone },
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { selectedUnit } = useUnit();
  const { subscription } = useAuth();
  const { isDeveloper } = useIsDeveloper();
  const { data: stats } = useSidebarStats();

  const getBadgeCount = (key: string): number => {
    if (!stats) return 0;
    return (stats as any)[key] || 0;
  };

  return (
    <Sidebar className="border-r border-sidebar-border/50 bg-gradient-to-b from-sidebar to-sidebar/95">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative">
            <Logo size="sm" showText={false} />
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">RestaurantOS</h2>
            {selectedUnit && (
              <p className="text-xs text-sidebar-foreground/60 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {selectedUnit.name}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group} className="mb-2">
            <SidebarGroupLabel className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest font-semibold flex items-center gap-2 mb-1">
              <group.icon className="w-3 h-3" />
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  const badgeCount = item.badge ? getBadgeCount(item.badge.key) : 0;
                  
                  const menuButton = (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "transition-all duration-200 group/item",
                          isActive && "bg-primary/10 text-primary shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <NavLink to={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon className={cn(
                              "w-4 h-4 transition-all duration-200",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover/item:text-sidebar-foreground"
                            )} />
                            <span className={cn(
                              "transition-colors",
                              isActive && "font-medium"
                            )}>
                              {item.title}
                            </span>
                          </div>
                          {item.badge && badgeCount > 0 && (
                            <SidebarBadge
                              count={badgeCount}
                              variant={item.badge.variant}
                              pulse={item.badge.pulse}
                            />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );

                  if (item.tooltip && badgeCount > 0) {
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>
                          {menuButton}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{badgeCount} {item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return menuButton;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 space-y-2 bg-sidebar/50 backdrop-blur-sm">
        {/* Subscription Badge */}
        <div className="px-2 pt-2">
          <SubscriptionBadge 
            tier={subscription.tier} 
            subscriptionEnd={subscription.subscriptionEnd} 
          />
        </div>
        
        <SidebarMenu>
          {/* Developer Admin Panel - Premium styling */}
          {isDeveloper && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/admin"}
                className={cn(
                  "transition-all duration-200 group/admin",
                  location.pathname === "/admin" 
                    ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-500 border border-red-500/30" 
                    : "hover:bg-red-500/10"
                )}
              >
                <NavLink to="/admin" className="flex items-center gap-2">
                  <div className={cn(
                    "p-1 rounded transition-all",
                    location.pathname === "/admin" 
                      ? "bg-red-500/20" 
                      : "group-hover/admin:bg-red-500/10"
                  )}>
                    <ShieldAlert className={cn(
                      "w-4 h-4 transition-all",
                      location.pathname === "/admin" ? "text-red-500" : "text-red-400 group-hover/admin:text-red-500"
                    )} />
                  </div>
                  <span className={cn(
                    "transition-colors",
                    location.pathname === "/admin" ? "text-red-500 font-semibold" : ""
                  )}>
                    Super Admin
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent transition-colors">
              <NavLink to="/pricing" className="group/link flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sidebar-foreground/70 group-hover/link:text-sidebar-foreground transition-colors" />
                <span>Planos</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent transition-colors">
              <NavLink to="/select-unit" className="group/link flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sidebar-foreground/70 group-hover/link:text-sidebar-foreground transition-colors" />
                <span>Trocar Unidade</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
