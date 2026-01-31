import { NavLink, useLocation } from "react-router-dom";
import { useUnit } from "@/contexts/UnitContext";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      { title: "WhatsApp", url: "/whatsapp/settings", icon: MessageSquare },
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

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary/10 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-sidebar-primary" />
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

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/select-unit">
                <Building2 className="w-4 h-4" />
                <span>Trocar Unidade</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
