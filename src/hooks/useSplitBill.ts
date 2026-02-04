import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";

type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

export type SplitMethod = "equal" | "by_order" | "custom";

interface PartialPayment {
  amount: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  splitType: SplitMethod;
  splitDetails: Record<string, unknown>;
}

interface BillPayment {
  id: string;
  table_id: string;
  unit_id: string;
  amount: number;
  customer_name: string | null;
  customer_phone: string;
  payment_method: string | null;
  split_type: string | null;
  split_details: Json | null;
  created_at: string;
}

export function useSplitBill(
  tableId: string,
  unitId: string | undefined,
  orders: OrderWithItems[],
  billTotal: number
) {
  const queryClient = useQueryClient();
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [peopleCount, setPeopleCount] = useState(2);
  const [customAmount, setCustomAmount] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [payingPartial, setPayingPartial] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch existing payments for this table (current session)
  const paymentsQuery = useQuery<BillPayment[]>({
    queryKey: ["bill-payments", tableId],
    queryFn: async () => {
      if (!tableId) return [];

      // Query bill_payments table via REST API (types not yet regenerated)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/bill_payments?table_id=eq.${tableId}&order=created_at.asc`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Failed to fetch payments:", await response.text());
        return [];
      }
      return (await response.json()) as BillPayment[];
    },
    enabled: !!tableId,
    staleTime: 10 * 1000,
  });

  // Calculate total already paid
  const totalPaid = useMemo(() => {
    return (paymentsQuery.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
  }, [paymentsQuery.data]);

  // Calculate remaining balance
  const remainingBalance = useMemo(() => {
    return Math.max(0, billTotal - totalPaid);
  }, [billTotal, totalPaid]);

  // Calculate payment count
  const paymentsCount = useMemo(() => {
    return (paymentsQuery.data || []).length;
  }, [paymentsQuery.data]);

  // Calculate amount to pay based on split method
  const amountToPay = useMemo(() => {
    switch (splitMethod) {
      case "equal":
        return Math.ceil((remainingBalance / peopleCount) * 100) / 100;
      case "by_order":
        return orders
          .filter((o) => selectedOrderIds.includes(o.id))
          .reduce((sum, o) => sum + o.total_price, 0);
      case "custom":
        return Math.min(customAmount, remainingBalance);
      default:
        return 0;
    }
  }, [splitMethod, remainingBalance, peopleCount, orders, selectedOrderIds, customAmount]);

  // Toggle order selection for by_order split
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  // Register partial payment mutation
  const payPartialMutation = useMutation({
    mutationFn: async (payment: PartialPayment) => {
      if (!tableId || !unitId) {
        throw new Error("Dados inválidos para registrar pagamento");
      }

      if (payment.amount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      if (payment.amount > remainingBalance + 0.01) {
        throw new Error("Valor excede o saldo restante");
      }

      setPayingPartial(true);

      // 1. Register the payment in the database via REST API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/bill_payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            table_id: tableId,
            unit_id: unitId,
            amount: payment.amount,
            customer_name: payment.customerName,
            customer_phone: payment.customerPhone,
            payment_method: payment.paymentMethod,
            split_type: payment.splitType,
            split_details: payment.splitDetails,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao registrar pagamento: ${errorText}`);
      }

      const paymentData = (await response.json())[0] as BillPayment;

      // 2. Send WhatsApp notification with partial payment receipt
      const newTotalPaid = totalPaid + payment.amount;
      const newRemainingBalance = billTotal - newTotalPaid;

      const referenceOrder = orders[0];
      if (referenceOrder) {
        try {
          await supabase.functions.invoke("send-order-notification", {
            body: {
              orderId: referenceOrder.id,
              status: "partial_payment",
              unitId: unitId,
              billData: {
                totalAmount: billTotal,
                paidAmount: payment.amount,
                totalPaid: newTotalPaid,
                remainingBalance: newRemainingBalance,
                customerName: payment.customerName,
                customerPhone: payment.customerPhone,
                splitType: payment.splitType,
                paymentsCount: paymentsCount + 1,
              },
            },
          });
        } catch (e) {
          console.error("Error sending partial payment notification:", e);
          // Don't throw - payment was registered successfully
        }
      }

      // 3. Check if bill is fully paid
      if (newRemainingBalance <= 0.01) {
        // Mark all orders as delivered
        const orderIds = orders.map((o) => o.id);
        if (orderIds.length > 0) {
          await supabase
            .from("orders")
            .update({ status: "delivered" })
            .in("id", orderIds);
        }

        // Free the table
        await supabase
          .from("tables")
          .update({ status: "free" })
          .eq("id", tableId);
      }

      return {
        payment: paymentData,
        billFullyPaid: newRemainingBalance <= 0.01,
      };
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["bill-payments", tableId] });
      queryClient.invalidateQueries({ queryKey: ["table-bill", tableId] });
    },
    onSettled: () => {
      setPayingPartial(false);
    },
  });

  const payPartial = useCallback(
    (customerName: string, customerPhone: string) => {
      const cleanPhone = customerPhone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        throw new Error("Informe um telefone válido");
      }

      if (amountToPay <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      return payPartialMutation.mutateAsync({
        amount: amountToPay,
        customerName: customerName || "Cliente",
        customerPhone: cleanPhone,
        paymentMethod: "pix",
        splitType: splitMethod,
        splitDetails: {
          peopleCount: splitMethod === "equal" ? peopleCount : undefined,
          selectedOrders: splitMethod === "by_order" ? selectedOrderIds : undefined,
          customAmount: splitMethod === "custom" ? customAmount : undefined,
        },
      });
    },
    [
      amountToPay,
      payPartialMutation,
      splitMethod,
      peopleCount,
      selectedOrderIds,
      customAmount,
    ]
  );

  const resetSplitState = useCallback(() => {
    setSplitMethod("equal");
    setPeopleCount(2);
    setCustomAmount(0);
    setSelectedOrderIds([]);
    setPaymentSuccess(false);
  }, []);

  return {
    // Split configuration
    splitMethod,
    setSplitMethod,
    peopleCount,
    setPeopleCount,
    customAmount,
    setCustomAmount,
    selectedOrderIds,
    toggleOrderSelection,

    // Payment state
    totalPaid,
    remainingBalance,
    paymentsCount,
    amountToPay,
    payments: paymentsQuery.data || [],
    paymentsLoading: paymentsQuery.isLoading,

    // Actions
    payPartial,
    payingPartial,
    paymentSuccess,
    resetSplitState,
  };
}
