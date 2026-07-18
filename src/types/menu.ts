// Tipos compartilhados do módulo de Cardápio
export interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
  delivery_price: number | null;
  available: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_price: number | null;
  category_id: string | null;
  available: boolean;
  preparation_time: number;
  image_url?: string | null;
  created_at?: string;
  is_variable_price?: boolean;
  min_price?: number | null;
  max_price?: number | null;
  categories?: Category;
  variations?: ProductVariation[];
}

export type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "recent";
export type AvailabilityFilter = "all" | "available" | "unavailable";
export type ViewMode = "grid" | "list";

export interface VariationFormItem {
  id?: string;
  name: string;
  price: string;
  delivery_price: string;
  _deleted?: boolean;
}

export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  delivery_price: string;
  category_id: string;
  preparation_time: string;
  is_variable_price: boolean;
  min_price: string;
  max_price: string;
}

export interface CategoryFormState {
  name: string;
  description: string;
}
