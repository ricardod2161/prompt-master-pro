export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          expected_amount: number | null
          final_amount: number | null
          id: string
          initial_amount: number
          notes: string | null
          opened_at: string
          opened_by: string | null
          unit_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          expected_amount?: number | null
          final_amount?: number | null
          id?: string
          initial_amount?: number
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          unit_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          expected_amount?: number | null
          final_amount?: number | null
          id?: string
          initial_amount?: number
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          phone: string | null
          unit_id: string
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          unit_id: string
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          unit_id?: string
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          address: string
          created_at: string
          delivery_time: string | null
          dispatch_time: string | null
          driver_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          order_id: string
        }
        Insert: {
          address: string
          created_at?: string
          delivery_time?: string | null
          dispatch_time?: string | null
          driver_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id: string
        }
        Update: {
          address?: string
          created_at?: string
          delivery_time?: string | null
          dispatch_time?: string | null
          driver_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          current_stock: number
          id: string
          min_stock: number | null
          name: string
          unit_id: string
          unit_measure: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number | null
          name: string
          unit_id: string
          unit_measure: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number | null
          name?: string
          unit_id?: string
          unit_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity: number
          reference_id: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          quantity: number
          reference_id?: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          type?: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          kitchen_status: Database["public"]["Enums"]["kitchen_status"] | null
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"] | null
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"] | null
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: Database["public"]["Enums"]["order_channel"]
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: number
          status: Database["public"]["Enums"]["order_status"] | null
          table_id: string | null
          total_price: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          table_id?: string | null
          total_price?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          table_id?: string | null
          total_price?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          available: boolean | null
          created_at: string
          id: string
          name: string
          price: number
          product_id: string
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          id?: string
          name: string
          price?: number
          product_id: string
        }
        Update: {
          available?: boolean | null
          created_at?: string
          id?: string
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string
          delivery_price: number | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          preparation_time: number | null
          price: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          preparation_time?: number | null
          price?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          preparation_time?: number | null
          price?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          id: string
          number: number
          qr_code: string | null
          status: Database["public"]["Enums"]["table_status"] | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          qr_code?: string | null
          status?: Database["public"]["Enums"]["table_status"] | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          qr_code?: string | null
          status?: Database["public"]["Enums"]["table_status"] | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_settings: {
        Row: {
          accent_color: string | null
          auto_notify_enabled: boolean | null
          auto_print_enabled: boolean | null
          counter_ordering_enabled: boolean | null
          created_at: string | null
          currency: string | null
          dark_mode_enabled: boolean | null
          default_preparation_time: number | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          error_color: string | null
          id: string
          min_delivery_order: number | null
          opening_hours: Json | null
          payment_methods: Json | null
          primary_color: string | null
          service_fee_percentage: number | null
          sidebar_color: string | null
          success_color: string | null
          table_ordering_enabled: boolean | null
          timezone: string | null
          unit_id: string
          updated_at: string | null
          warning_color: string | null
          whatsapp_ordering_enabled: boolean | null
        }
        Insert: {
          accent_color?: string | null
          auto_notify_enabled?: boolean | null
          auto_print_enabled?: boolean | null
          counter_ordering_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          dark_mode_enabled?: boolean | null
          default_preparation_time?: number | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          error_color?: string | null
          id?: string
          min_delivery_order?: number | null
          opening_hours?: Json | null
          payment_methods?: Json | null
          primary_color?: string | null
          service_fee_percentage?: number | null
          sidebar_color?: string | null
          success_color?: string | null
          table_ordering_enabled?: boolean | null
          timezone?: string | null
          unit_id: string
          updated_at?: string | null
          warning_color?: string | null
          whatsapp_ordering_enabled?: boolean | null
        }
        Update: {
          accent_color?: string | null
          auto_notify_enabled?: boolean | null
          auto_print_enabled?: boolean | null
          counter_ordering_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          dark_mode_enabled?: boolean | null
          default_preparation_time?: number | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          error_color?: string | null
          id?: string
          min_delivery_order?: number | null
          opening_hours?: Json | null
          payment_methods?: Json | null
          primary_color?: string | null
          service_fee_percentage?: number | null
          sidebar_color?: string | null
          success_color?: string | null
          table_ordering_enabled?: boolean | null
          timezone?: string | null
          unit_id?: string
          updated_at?: string | null
          warning_color?: string | null
          whatsapp_ordering_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_units: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          is_bot_active: boolean | null
          last_message: string | null
          last_message_at: string | null
          phone: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          is_bot_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          phone: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          is_bot_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          phone?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          media_caption: string | null
          media_duration: number | null
          media_type: string | null
          media_url: string | null
          message_id: string | null
          role: string
          status: string | null
          transcription: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          media_caption?: string | null
          media_duration?: number | null
          media_type?: string | null
          media_url?: string | null
          message_id?: string | null
          role: string
          status?: string | null
          transcription?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          media_caption?: string | null
          media_duration?: number | null
          media_type?: string | null
          media_url?: string | null
          message_id?: string | null
          role?: string
          status?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_token: string | null
          api_url: string | null
          bot_enabled: boolean | null
          created_at: string
          id: string
          instance_name: string | null
          system_prompt: string | null
          unit_id: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          api_token?: string | null
          api_url?: string | null
          bot_enabled?: boolean | null
          created_at?: string
          id?: string
          instance_name?: string | null
          system_prompt?: string | null
          unit_id: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          api_token?: string | null
          api_url?: string | null
          bot_enabled?: boolean | null
          created_at?: string
          id?: string
          instance_name?: string | null
          system_prompt?: string | null
          unit_id?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_typing_status: {
        Row: {
          conversation_id: string
          expires_at: string | null
          id: string
          is_recording: boolean | null
          is_typing: boolean | null
          updated_at: string | null
        }
        Insert: {
          conversation_id: string
          expires_at?: string | null
          id?: string
          is_recording?: boolean | null
          is_typing?: boolean | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string
          expires_at?: string | null
          id?: string
          is_recording?: boolean | null
          is_typing?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_typing_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_unit_access: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "cashier"
        | "kitchen"
        | "waiter"
        | "developer"
      cash_movement_type:
        | "opening"
        | "sale"
        | "withdrawal"
        | "deposit"
        | "closing"
      inventory_movement_type:
        | "purchase"
        | "sale"
        | "adjustment"
        | "waste"
        | "transfer"
      kitchen_status: "pending" | "preparing" | "ready"
      order_channel: "whatsapp" | "table" | "counter" | "delivery"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      payment_method: "cash" | "credit" | "debit" | "pix" | "voucher"
      table_status: "free" | "occupied" | "pending_order"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "cashier",
        "kitchen",
        "waiter",
        "developer",
      ],
      cash_movement_type: [
        "opening",
        "sale",
        "withdrawal",
        "deposit",
        "closing",
      ],
      inventory_movement_type: [
        "purchase",
        "sale",
        "adjustment",
        "waste",
        "transfer",
      ],
      kitchen_status: ["pending", "preparing", "ready"],
      order_channel: ["whatsapp", "table", "counter", "delivery"],
      order_status: ["pending", "preparing", "ready", "delivered", "cancelled"],
      payment_method: ["cash", "credit", "debit", "pix", "voucher"],
      table_status: ["free", "occupied", "pending_order"],
    },
  },
} as const
