import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CartItem = {
  product: Tables<"products">;
  quantity: number;
  notes?: string;
};

export type CustomerInfo = {
  name: string;
  phone: string;
};

export function useCustomerOrder(tableId: string) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "" });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // Fetch table data
  const tableQuery = useQuery({
    queryKey: ["public-table", tableId],
    queryFn: async () => {
      // Validate UUID format first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        throw new Error("ID de mesa inválido");
      }

      const { data, error } = await supabase
        .from("tables")
        .select(`
          *,
          unit:units(*)
        `)
        .eq("id", tableId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Mesa não encontrada");
      
      return data as Tables<"tables"> & { unit: Tables<"units"> };
    },
    enabled: !!tableId,
    retry: 1,
  });

  // Fetch products for the unit
  const productsQuery = useQuery({
    queryKey: ["public-products", tableQuery.data?.unit_id],
    queryFn: async () => {
      if (!tableQuery.data?.unit_id) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("unit_id", tableQuery.data.unit_id)
        .eq("available", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!tableQuery.data?.unit_id,
  });

  // Fetch categories for the unit
  const categoriesQuery = useQuery({
    queryKey: ["public-categories", tableQuery.data?.unit_id],
    queryFn: async () => {
      if (!tableQuery.data?.unit_id) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("unit_id", tableQuery.data.unit_id)
        .eq("active", true)
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!tableQuery.data?.unit_id,
  });

  // Cart management
  const addToCart = useCallback((product: Tables<"products">, quantity: number = 1, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
  }, []);

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!tableQuery.data?.unit_id || cart.length === 0) {
        throw new Error("Dados inválidos para criar pedido");
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          unit_id: tableQuery.data.unit_id,
          table_id: tableId,
          channel: "table" as const,
          status: "pending",
          total_price: cartTotal,
          customer_name: customerInfo.name || null,
          customer_phone: customerInfo.phone || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status to occupied
      const { error: tableError } = await supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", tableId);

      if (tableError) console.error("Error updating table status:", tableError);

      return order;
    },
    onSuccess: (order) => {
      setOrderSuccess(true);
      setOrderNumber(order.order_number);
      clearCart();
      setCustomerInfo({ name: "", phone: "" });
    },
  });

  const submitOrder = useCallback(() => {
    createOrderMutation.mutate();
  }, [createOrderMutation]);

  const resetOrder = useCallback(() => {
    setOrderSuccess(false);
    setOrderNumber(null);
  }, []);

  return {
    // Table data
    table: tableQuery.data,
    tableLoading: tableQuery.isLoading,
    tableError: tableQuery.error,

    // Products data
    products: productsQuery.data || [],
    productsLoading: productsQuery.isLoading,

    // Categories data
    categories: categoriesQuery.data || [],
    categoriesLoading: categoriesQuery.isLoading,

    // Cart management
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemsCount,

    // Customer info
    customerInfo,
    setCustomerInfo,

    // Order submission
    submitOrder,
    isSubmitting: createOrderMutation.isPending,
    submitError: createOrderMutation.error,
    orderSuccess,
    orderNumber,
    resetOrder,
  };
}
