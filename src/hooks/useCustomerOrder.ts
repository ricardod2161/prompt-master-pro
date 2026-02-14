import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CartItem = {
  product: Tables<"products">;
  quantity: number;
  notes?: string;
  variationName?: string;
  variationPrice?: number;
};

export type CustomerInfo = {
  name: string;
  phone: string;
};

export type PaymentMethod = "cash" | "pix" | "credit" | null;

// UUID validation regex - defined once
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useCustomerOrder(tableId: string) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "" });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [changeFor, setChangeFor] = useState<string>("");

  // Validate tableId format upfront
  const isValidTableId = useMemo(() => UUID_REGEX.test(tableId), [tableId]);

  // Fetch table data with optimized caching
  const tableQuery = useQuery({
    queryKey: ["public-table", tableId],
    queryFn: async () => {
      if (!isValidTableId) {
        throw new Error("ID de mesa inválido");
      }

      const { data, error } = await supabase
        .from("tables")
        .select(`*, unit:units(*)`)
        .eq("id", tableId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Mesa não encontrada");
      
      return data as Tables<"tables"> & { unit: Tables<"units"> };
    },
    enabled: !!tableId && isValidTableId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - table info rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const unitId = tableQuery.data?.unit_id;

  // Fetch unit settings (Pix config)
  const unitSettingsQuery = useQuery({
    queryKey: ["public-unit-settings", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const { data, error } = await supabase
        .from("unit_settings")
        .select("pix_key, pix_merchant_name, pix_merchant_city")
        .eq("unit_id", unitId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Fetch products for the unit - optimized with longer cache
  const productsQuery = useQuery({
    queryKey: ["public-products", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`*, category:categories(*)`)
        .eq("unit_id", unitId)
        .eq("available", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
    staleTime: 2 * 60 * 1000, // 2 minutes - products can change
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch categories for the unit - optimized with longer cache
  const categoriesQuery = useQuery({
    queryKey: ["public-categories", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("unit_id", unitId)
        .eq("active", true)
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Cart management - memoized callbacks
  const addToCart = useCallback((product: Tables<"products">, quantity: number = 1, notes?: string, variationName?: string, variationPrice?: number) => {
    setCart((prev) => {
      const cartKey = variationName ? `${product.id}_${variationName}` : product.id;
      const existing = prev.find((item) => {
        const itemKey = item.variationName ? `${item.product.id}_${item.variationName}` : item.product.id;
        return itemKey === cartKey;
      });
      if (existing) {
        return prev.map((item) => {
          const itemKey = item.variationName ? `${item.product.id}_${item.variationName}` : item.product.id;
          return itemKey === cartKey
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item;
        });
      }
      return [...prev, { product, quantity, notes, variationName, variationPrice }];
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

  // Memoized cart calculations
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => {
      const price = item.variationPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0),
    [cart]
  );

  const cartItemsCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!unitId || cart.length === 0) {
        throw new Error("Dados inválidos para criar pedido");
      }

      if (!paymentMethod) {
        throw new Error("Selecione uma forma de pagamento");
      }

      const changeForValue = parseFloat(changeFor) || null;
      
      if (paymentMethod === "cash" && changeForValue && changeForValue < cartTotal) {
        throw new Error("Valor insuficiente para pagamento");
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          unit_id: unitId,
          table_id: tableId,
          channel: "table" as const,
          status: "pending",
          total_price: cartTotal,
          customer_name: customerInfo.name || null,
          customer_phone: customerInfo.phone || null,
          payment_method: paymentMethod,
          change_for: paymentMethod === "cash" ? changeForValue : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => {
        const price = item.variationPrice ?? item.product.price;
        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.variationName
            ? `${item.product.name} (${item.variationName})`
            : item.product.name,
          quantity: item.quantity,
          unit_price: price,
          total_price: price * item.quantity,
          notes: item.notes || null,
          variation_name: item.variationName || null,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status to occupied (fire and forget)
      supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", tableId)
        .then(({ error }) => {
          if (error) console.error("Error updating table status:", error);
        });

      return order;
    },
    onSuccess: (order) => {
      // Haptic feedback for success
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
      setOrderSuccess(true);
      setOrderNumber(order.order_number);
      setOrderId(order.id);
      setTrackingToken(order.tracking_token);
      
      // Enviar notificação WhatsApp com Pix automaticamente
      if (customerInfo.phone && unitId) {
        supabase.functions.invoke("send-order-notification", {
          body: {
            orderId: order.id,
            status: "confirmed",
            unitId: unitId,
          },
        }).catch((err) => {
          console.log("WhatsApp notification skipped:", err);
        });
      }
      
      clearCart();
      setCustomerInfo({ name: "", phone: "" });
      setPaymentMethod(null);
      setChangeFor("");
    },
    onError: (error) => {
      console.error("Error creating order:", error);
    },
  });

  const submitOrder = useCallback(() => {
    createOrderMutation.mutate();
  }, [createOrderMutation]);

  const resetOrder = useCallback(() => {
    setOrderSuccess(false);
    setOrderNumber(null);
    setOrderId(null);
    setTrackingToken(null);
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

    // Unit settings (Pix)
    unitSettings: unitSettingsQuery.data,

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

    // Payment
    paymentMethod,
    setPaymentMethod,
    changeFor,
    setChangeFor,

    // Order submission
    submitOrder,
    isSubmitting: createOrderMutation.isPending,
    submitError: createOrderMutation.error,
    orderSuccess,
    orderNumber,
    orderId,
    trackingToken,
    resetOrder,
  };
}
