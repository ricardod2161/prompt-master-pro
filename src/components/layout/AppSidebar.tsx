import { NavLink, useLocation } from "react-router-dom";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
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
  Utensils,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";

const menuItems = [
  {
    group: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "PDV", url: "/pos", icon: ShoppingCart },
      { title: "KDS", url: "/kds", icon: ChefHat },
      { title: "Pedidos", url: "/orders", icon: ClipboardList },
    ],
  },
  {
    group: "Gestão",
    items: [
      { title: "Cardápio", url: "/menu", icon: UtensilsCrossed },
      { title: "Estoque", url: "/inventory", icon: Package },
      { title: "Mesas", url: "/tables", icon: QrCode },
    ],
  },
  {
    group: "Operacional",
    items: [
      { title: "Delivery", url: "/delivery", icon: Truck },
      { title: "Caixa", url: "/cashier", icon: Wallet },
      { title: "WhatsApp", url: "/whatsapp/chat", icon: MessageSquare },
    ],
  },
  {
    group: "Análises",
    items: [
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { selectedUnit } = useUnit();
  const { subscription } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border/50">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Utensils className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">RestaurantOS</h2>
            {selectedUnit && (
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {selectedUnit.name}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "transition-all duration-200",
                          isActive && "bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
                        )}
                      >
                        <NavLink to={item.url} className="group">
                          <item.icon className={cn(
                            "w-4 h-4 transition-transform group-hover:scale-110",
                            isActive && "text-sidebar-primary"
                          )} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 space-y-2">
        {/* Subscription Badge */}
        <div className="px-2 pt-2">
          <SubscriptionBadge 
            tier={subscription.tier} 
            subscriptionEnd={subscription.subscriptionEnd} 
          />
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent">
              <NavLink to="/pricing" className="group">
                <CreditCard className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Planos</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent">
              <NavLink to="/select-unit" className="group">
                <Building2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Trocar Unidade</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}