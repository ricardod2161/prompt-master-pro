import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Loader2,
  Search,
  UtensilsCrossed,
  Trash2,
  Package,
  CheckCircle2,
  Tags,
  DollarSign,
  Upload,
  X,
  ArrowUpDown,
  FilterX,
  Download,
  Eye,
  EyeOff,
  Layers,
  Power,
  PowerOff,
  LayoutGrid,
  List,
  FolderInput,
  Flame,
} from "lucide-react";
import { ProductCard } from "@/components/menu/ProductCard";
import { CategoryChips } from "@/components/menu/CategoryChips";
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
  delivery_price: number | null;
  available: boolean;
  sort_order: number;
}

interface Product {
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

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "recent";
type AvailabilityFilter = "all" | "available" | "unavailable";
type ViewMode = "grid" | "list";

// Variation form item
interface VariationFormItem {
  id?: string;
  name: string;
  price: string;
  delivery_price: string;
  _deleted?: boolean;
}

export default function Menu() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem("menuViewMode") as ViewMode) || "grid"
  );

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [moveCategoryOpen, setMoveCategoryOpen] = useState(false);
  const [movingCategory, setMovingCategory] = useState(false);

  // Order counts (today, filtered by unit)
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    delivery_price: "",
    category_id: "",
    preparation_time: "15",
    is_variable_price: false,
    min_price: "",
    max_price: "",
  });
  const [variationsForm, setVariationsForm] = useState<VariationFormItem[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "product" | "category";
    id: string;
    name: string;
  }>({ open: false, type: "product", id: "", name: "" });

  useEffect(() => {
    if (selectedUnit) {
      fetchData();
    }
  }, [selectedUnit]);

  const fetchData = async () => {
    if (!selectedUnit) return;
    setLoading(true);
    try {
      // Start of today in ISO format for filtering
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [categoriesRes, productsRes, variationsRes, orderCountsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("unit_id", selectedUnit.id)
          .order("sort_order"),
        supabase
          .from("products")
          .select("*, categories(*)")
          .eq("unit_id", selectedUnit.id)
          .order("name"),
        // FIX: Single query with RLS filtering (no nested sub-query)
        supabase
          .from("product_variations")
          .select("*, products!inner(unit_id)")
          .eq("products.unit_id", selectedUnit.id)
          .order("sort_order"),
        // FIX: Filter by unit and only today's orders via JOIN
        supabase
          .from("order_items")
          .select("product_id, quantity, orders!inner(unit_id, created_at)")
          .eq("orders.unit_id", selectedUnit.id)
          .gte("orders.created_at", startOfToday.toISOString())
          .not("product_id", "is", null),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;

      // Map variations to products
      const variationsMap: Record<string, ProductVariation[]> = {};
      if (variationsRes.data) {
        variationsRes.data.forEach((v: any) => {
          if (!variationsMap[v.product_id]) variationsMap[v.product_id] = [];
          variationsMap[v.product_id].push(v);
        });
      }

      const productsWithVariations = (productsRes.data || []).map((p: any) => ({
        ...p,
        variations: variationsMap[p.id] || [],
      }));

      // Count orders per product (today only, current unit)
      const counts: Record<string, number> = {};
      if (orderCountsRes.data) {
        orderCountsRes.data.forEach((item: any) => {
          if (item.product_id) {
            counts[item.product_id] = (counts[item.product_id] || 0) + item.quantity;
          }
        });
      }

      setCategories(categoriesRes.data || []);
      setProducts(productsWithVariations);
      setOrderCounts(counts);
    } catch (error: any) {
      console.error("Error fetching menu data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Invalidate React Query caches after mutations (keeps PDV/digital menu in sync)
  const invalidateRelatedCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }, [queryClient]);

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "Máximo 5MB" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !selectedUnit) return null;
    setUploadingImage(true);
    try {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${selectedUnit.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Product CRUD
  const openProductDialog = (product?: Product) => {
    setFormError(null);
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        delivery_price: product.delivery_price ? String(product.delivery_price) : "",
        category_id: product.category_id || "",
        preparation_time: String(product.preparation_time),
        is_variable_price: product.is_variable_price || false,
        min_price: product.min_price ? String(product.min_price) : "",
        max_price: product.max_price ? String(product.max_price) : "",
      });
      setImagePreview(product.image_url || null);
      setImageFile(null);
      setVariationsForm(
        (product.variations || []).map((v) => ({
          id: v.id,
          name: v.name,
          price: String(v.price),
          delivery_price: v.delivery_price ? String(v.delivery_price) : "",
        }))
      );
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        delivery_price: "",
        category_id: "",
        preparation_time: "15",
        is_variable_price: false,
        min_price: "",
        max_price: "",
      });
      setImagePreview(null);
      setImageFile(null);
      setVariationsForm([]);
    }
    setProductDialogOpen(true);
  };

  const addVariation = () => {
    setVariationsForm((prev) => [...prev, { name: "", price: "", delivery_price: "" }]);
  };

  const updateVariation = (index: number, field: keyof VariationFormItem, value: string) => {
    setVariationsForm((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const removeVariation = (index: number) => {
    setVariationsForm((prev) => {
      const item = prev[index];
      if (item.id) {
        return prev.map((v, i) => (i === index ? { ...v, _deleted: true } : v));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setFormError(null);

    // Validations
    const trimmedName = productForm.name.trim();
    if (!trimmedName) {
      setFormError("O nome do produto não pode ser vazio ou conter apenas espaços.");
      return;
    }

    const prepTime = parseInt(productForm.preparation_time);
    if (!prepTime || prepTime < 1) {
      setFormError("O tempo de preparo deve ser pelo menos 1 minuto.");
      return;
    }

    if (productForm.is_variable_price && productForm.min_price && productForm.max_price) {
      const min = parseFloat(productForm.min_price);
      const max = parseFloat(productForm.max_price);
      if (min >= max) {
        setFormError("O valor mínimo deve ser menor que o valor máximo.");
        return;
      }
    }

    setSavingProduct(true);
    try {
      let imageUrl: string | null | undefined = undefined;

      if (imageFile) {
        imageUrl = await uploadImage();
      } else if (imagePreview === null && editingProduct?.image_url) {
        imageUrl = null;
      }

      const baseData = {
        unit_id: selectedUnit.id,
        name: trimmedName,
        description: productForm.description.trim() || null,
        price: productForm.is_variable_price ? 0 : (productForm.price ? parseFloat(productForm.price) : 0),
        delivery_price: productForm.delivery_price ? parseFloat(productForm.delivery_price) : null,
        category_id: productForm.category_id || null,
        preparation_time: prepTime,
        is_variable_price: productForm.is_variable_price,
        min_price: productForm.is_variable_price && productForm.min_price ? parseFloat(productForm.min_price) : null,
        max_price: productForm.is_variable_price && productForm.max_price ? parseFloat(productForm.max_price) : null,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase.from("products").update(baseData).eq("id", editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
      } else {
        const { data, error } = await supabase.from("products").insert(baseData).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle variations
      const activeVariations = variationsForm.filter((v) => !v._deleted);
      const deletedVariations = variationsForm.filter((v) => v._deleted && v.id);

      if (deletedVariations.length > 0) {
        await supabase
          .from("product_variations")
          .delete()
          .in("id", deletedVariations.map((v) => v.id!));
      }

      for (let i = 0; i < activeVariations.length; i++) {
        const v = activeVariations[i];
        if (!v.name || !v.price) continue;
        const varData = {
          product_id: productId,
          name: v.name.trim(),
          price: parseFloat(v.price),
          delivery_price: v.delivery_price ? parseFloat(v.delivery_price) : null,
          sort_order: i,
        };
        if (v.id) {
          await supabase.from("product_variations").update(varData).eq("id", v.id);
        } else {
          await supabase.from("product_variations").insert(varData);
        }
      }

      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      setProductDialogOpen(false);
      fetchData();
      invalidateRelatedCaches();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto", { description: error.message });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductAvailability = async (product: Product) => {
    try {
      const { error } = await supabase.from("products").update({ available: !product.available }).eq("id", product.id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, available: !p.available } : p)));
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao atualizar disponibilidade");
    }
  };

  const confirmDeleteProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setDeleteDialog({
      open: true,
      type: "product",
      id: productId,
      name: product?.name || "este produto",
    });
  };

  const handleDeleteProduct = async () => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", deleteDialog.id);
      if (error) throw error;
      toast.success("Produto excluído!");
      setDeleteDialog({ open: false, type: "product", id: "", name: "" });
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao excluir produto");
    }
  };

  // Duplicate product
  const handleDuplicateProduct = async (product: Product) => {
    if (!selectedUnit) return;
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          unit_id: selectedUnit.id,
          name: `Cópia de ${product.name}`,
          description: product.description,
          price: product.price,
          delivery_price: product.delivery_price,
          category_id: product.category_id,
          preparation_time: product.preparation_time,
          image_url: product.image_url,
          available: product.available,
          is_variable_price: product.is_variable_price || false,
          min_price: product.min_price || null,
          max_price: product.max_price || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (product.variations && product.variations.length > 0) {
        const variationsCopy = product.variations.map((v) => ({
          product_id: data.id,
          name: v.name,
          price: v.price,
          delivery_price: v.delivery_price,
          available: v.available,
          sort_order: v.sort_order,
        }));
        await supabase.from("product_variations").insert(variationsCopy);
      }

      toast.success("Produto duplicado!");
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao duplicar produto");
    }
  };

  // Bulk actions
  const toggleSelectProduct = (productId: string, selected: boolean) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (selected) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedProducts.size === 0) return;

    // Confirm bulk delete via dialog
    if (action === "delete") {
      setBulkDeleteDialog(true);
      return;
    }

    setBulkProcessing(true);
    try {
      const ids = Array.from(selectedProducts);
      const available = action === "activate";
      const { error } = await supabase
        .from("products")
        .update({ available })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} produto(s) ${available ? "ativado(s)" : "desativado(s)"}!`);
      clearSelection();
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro na ação em lote");
    } finally {
      setBulkProcessing(false);
    }
  };

  const executeBulkDelete = async () => {
    setBulkDeleteDialog(false);
    setBulkProcessing(true);
    try {
      const ids = Array.from(selectedProducts);
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} produto(s) excluído(s)!`);
      clearSelection();
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao excluir produtos");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleMoveToCategory = async (categoryId: string | null) => {
    if (selectedProducts.size === 0) return;
    setMovingCategory(true);
    try {
      const ids = Array.from(selectedProducts);
      const { error } = await supabase
        .from("products")
        .update({ category_id: categoryId })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} produto(s) movido(s)!`);
      setMoveCategoryOpen(false);
      clearSelection();
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao mover produtos");
    } finally {
      setMovingCategory(false);
    }
  };

  // Export CSV — FIX: handle variable price products correctly
  const exportCSV = () => {
    const headers = ["Nome", "Categoria", "Preço", "Preço Delivery", "Disponível", "Tempo Preparo", "Variações"];
    const rows = products.map((p) => {
      const vars = (p.variations || [])
        .map((v) => `${v.name}: R$${v.price.toFixed(2)}${v.delivery_price ? ` (delivery: R$${v.delivery_price.toFixed(2)})` : ""}`)
        .join("; ");
      const priceDisplay = p.is_variable_price
        ? `Variável (${p.min_price ? `min: R$${p.min_price.toFixed(2)}` : ""}${p.min_price && p.max_price ? ", " : ""}${p.max_price ? `max: R$${p.max_price.toFixed(2)}` : ""})`
        : p.price.toFixed(2);
      return [
        p.name,
        p.categories?.name || "Sem categoria",
        priceDisplay,
        p.delivery_price?.toFixed(2) || "",
        p.available ? "Sim" : "Não",
        String(p.preparation_time),
        vars,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardapio_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Cardápio exportado!");
  };

  // Category CRUD
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || "" });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setSavingCategory(true);
    try {
      const categoryData = {
        unit_id: selectedUnit.id,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        sort_order: editingCategory?.sort_order || categories.length,
      };
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Categoria atualizada!");
      } else {
        const { error } = await supabase.from("categories").insert(categoryData);
        if (error) throw error;
        toast.success("Categoria criada!");
      }
      setCategoryDialogOpen(false);
      fetchData();
      invalidateRelatedCaches();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error("Erro ao salvar categoria", { description: error.message });
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDeleteCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setDeleteDialog({
      open: true,
      type: "category",
      id: categoryId,
      name: category?.name || "esta categoria",
    });
  };

  const handleDeleteCategory = async () => {
    try {
      await supabase.from("products").update({ category_id: null }).eq("category_id", deleteDialog.id);
      const { error } = await supabase.from("categories").delete().eq("id", deleteDialog.id);
      if (error) throw error;
      toast.success("Categoria excluída!");
      setDeleteDialog({ open: false, type: "category", id: "", name: "" });
      setCategoryDialogOpen(false);
      fetchData();
      invalidateRelatedCaches();
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleCategoryReorder = (reorderedCategories: Category[]) => {
    setCategories(reorderedCategories);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("menuViewMode", mode);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Computed values
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const key = p.category_id || "uncategorized";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const availableCount = useMemo(() => products.filter((p) => p.available).length, [products]);

  // FIX: avgPrice excludes variable-price products (which have price=0)
  const avgPrice = useMemo(() => {
    const fixedPriceProducts = products.filter((p) => !p.is_variable_price && p.price > 0);
    if (fixedPriceProducts.length === 0) return 0;
    return fixedPriceProducts.reduce((sum, p) => sum + p.price, 0) / fixedPriceProducts.length;
  }, [products]);

  // Top 3 products by today's order count
  const topProductIds = useMemo(() => {
    const sorted = Object.entries(orderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);
    return new Set(sorted);
  }, [orderCounts]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" ||
        (filterCategory === "uncategorized" ? !product.category_id : product.category_id === filterCategory);
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" ? product.available : !product.available);
      return matchesSearch && matchesCategory && matchesAvailability;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "recent": return (b.created_at || "").localeCompare(a.created_at || "");
        default: return 0;
      }
    });

    return result;
  }, [products, searchTerm, filterCategory, sortBy, availabilityFilter]);

  const hasActiveFilters = searchTerm || filterCategory !== "all" || sortBy !== "name-asc" || availabilityFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setSortBy("name-asc");
    setAvailabilityFilter("all");
  };

  const selectionMode = selectedProducts.size > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cardápio</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie produtos e categorias do seu cardápio
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => openCategoryDialog()}>
                <FolderOpen className="w-4 h-4 mr-1" />
                Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSaveCategory}>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? "Atualize os dados da categoria" : "Crie uma nova categoria de produtos"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Ex: Lanches"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                  {editingCategory && (
                    <Button type="button" variant="destructive" onClick={() => confirmDeleteCategory(editingCategory.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={savingCategory}>
                      {savingCategory ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openProductDialog()}>
                <Plus className="w-4 h-4 mr-1" />
                Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSaveProduct}>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Atualize os dados do produto" : "Adicione um novo produto ao cardápio"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Form error */}
                  {formError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                      {formError}
                    </div>
                  )}

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Foto do Produto</Label>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Upload</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="text-xs text-muted-foreground">
                        <p>JPG, PNG ou WebP</p>
                        <p>Máximo 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Ex: X-Burger"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Ingredientes, observações..."
                    />
                  </div>

                  {/* Variable Price Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        🔄 Preço Variável
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Cliente define o valor (porções, kg, etc.)
                      </p>
                    </div>
                    <Switch
                      checked={productForm.is_variable_price}
                      onCheckedChange={(checked) => setProductForm({ ...productForm, is_variable_price: checked, price: checked ? "" : productForm.price })}
                    />
                  </div>

                  {/* Min/Max price fields when variable */}
                  {productForm.is_variable_price && (
                    <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="space-y-2">
                        <Label className="text-xs">Valor Mínimo (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.min_price}
                          onChange={(e) => setProductForm({ ...productForm, min_price: e.target.value })}
                          placeholder="Ex: 10,00"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Valor Máximo (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.max_price}
                          onChange={(e) => setProductForm({ ...productForm, max_price: e.target.value })}
                          placeholder="Ex: 200,00"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Fixed price fields when NOT variable */}
                  {!productForm.is_variable_price && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço Base</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço Delivery</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.delivery_price}
                          onChange={(e) => setProductForm({ ...productForm, delivery_price: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  )}
                  {productForm.is_variable_price && (
                    <div className="space-y-2">
                      <Label>Preço Delivery (fixo, opcional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.delivery_price}
                        onChange={(e) => setProductForm({ ...productForm, delivery_price: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={productForm.category_id}
                        onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tempo de Preparo (min) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={productForm.preparation_time}
                        onChange={(e) => setProductForm({ ...productForm, preparation_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Variations Section — FIX: Added delivery_price field */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Variações (P/M/G)
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addVariation}>
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {variationsForm.filter((v) => !v._deleted).length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma variação. Adicione para oferecer tamanhos ou sabores com preços diferentes.
                      </p>
                    )}
                    {variationsForm.map((variation, index) =>
                      variation._deleted ? null : (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Nome</Label>
                            <Input
                              value={variation.name}
                              onChange={(e) => updateVariation(index, "name", e.target.value)}
                              placeholder="Ex: Grande"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-xs">Preço</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variation.price}
                              onChange={(e) => updateVariation(index, "price", e.target.value)}
                              placeholder="0,00"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-xs">Delivery</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variation.delivery_price}
                              onChange={(e) => updateVariation(index, "delivery_price", e.target.value)}
                              placeholder="0,00"
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeVariation(index)}
                          >
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={savingProduct || uploadingImage}>
                    {savingProduct || uploadingImage ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadingImage ? "Enviando foto..." : "Salvando..."}</>
                    ) : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total de Produtos"
          value={products.length}
          icon={Package}
          iconColor="primary"
        />
        <StatCard
          title="Disponíveis"
          value={`${availableCount}/${products.length}`}
          icon={CheckCircle2}
          iconColor="success"
        />
        <StatCard
          title="Categorias"
          value={categories.filter((c) => c.active !== false).length}
          icon={Tags}
          iconColor="info"
        />
        {/* FIX: avgPrice now excludes variable-price products */}
        <StatCard
          title="Preço Médio"
          value={formatCurrency(avgPrice)}
          icon={DollarSign}
          iconColor="warning"
        />
      </div>

      {/* Category Chips — FIX: always rendered (even with no categories) */}
      <CategoryChips
        categories={categories}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        onEditCategory={openCategoryDialog}
        productCounts={productCounts}
        onReorder={handleCategoryReorder}
      />

      {/* Search + Sort + Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Availability filter */}
          <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}>
            <SelectTrigger className="w-[140px]">
              {availabilityFilter === "unavailable" ? (
                <EyeOff className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              ) : (
                <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              )}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="unavailable">Indisponíveis</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="price-asc">Preço (menor)</SelectItem>
              <SelectItem value="price-desc">Preço (maior)</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => handleViewModeChange("grid")}
              title="Visualização em grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => handleViewModeChange("list")}
              title="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
              <FilterX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk selection bar */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={(checked) => (checked ? selectAll() : clearSelection())}
            />
            <span className="text-muted-foreground">
              {selectionMode ? `${selectedProducts.size} selecionado(s)` : "Selecionar"}
            </span>
          </div>
          {selectionMode && (
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("activate")}
                disabled={bulkProcessing}
              >
                <Power className="w-3.5 h-3.5 mr-1" />
                Ativar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("deactivate")}
                disabled={bulkProcessing}
              >
                <PowerOff className="w-3.5 h-3.5 mr-1" />
                Desativar
              </Button>
              {/* Move to category */}
              <Popover open={moveCategoryOpen} onOpenChange={setMoveCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={bulkProcessing}>
                    <FolderInput className="w-3.5 h-3.5 mr-1" />
                    Mover para...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Mover para categoria</p>
                  <button
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    onClick={() => handleMoveToCategory(null)}
                    disabled={movingCategory}
                  >
                    {movingCategory ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                    Sem categoria
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                      onClick={() => handleMoveToCategory(cat.id)}
                      disabled={movingCategory}
                    >
                      {cat.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              {/* FIX: Bulk delete now opens confirmation dialog */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction("delete")}
                disabled={bulkProcessing}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir ({selectedProducts.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results indicator */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} resultado(s) encontrado(s)
        </p>
      )}

      {/* Products — Grid View */}
      {filteredProducts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openProductDialog}
                onDelete={confirmDeleteProduct}
                onToggleAvailability={handleToggleProductAvailability}
                onDuplicate={handleDuplicateProduct}
                formatCurrency={formatCurrency}
                index={index}
                selected={selectedProducts.has(product.id)}
                onSelect={toggleSelectProduct}
                selectionMode={selectionMode}
                orderCount={orderCounts[product.id]}
                isTop={topProductIds.has(product.id)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-8 p-2">
                    <Checkbox
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={(checked) => (checked ? selectAll() : clearSelection())}
                    />
                  </th>
                  <th className="text-left p-2 font-medium">Produto</th>
                  <th className="text-left p-2 font-medium hidden sm:table-cell">Categoria</th>
                  <th className="text-left p-2 font-medium">Preço</th>
                  <th className="text-left p-2 font-medium hidden md:table-cell">Delivery</th>
                  <th className="text-left p-2 font-medium hidden lg:table-cell">Pedidos hoje</th>
                  <th className="text-center p-2 font-medium">Ativo</th>
                  <th className="text-right p-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isTop = topProductIds.has(product.id);
                  const todayCount = orderCounts[product.id] || 0;
                  return (
                    <tr
                      key={product.id}
                      className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${selectedProducts.has(product.id) ? "bg-primary/5" : ""} ${!product.available ? "opacity-60" : ""}`}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => toggleSelectProduct(product.id, !!checked)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              {isTop && <Flame className="w-3 h-3 text-amber-500 shrink-0" />}
                              <span className="font-medium truncate max-w-[180px]">{product.name}</span>
                            </div>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 hidden sm:table-cell">
                        <span className="text-muted-foreground text-xs">
                          {product.categories?.name || "—"}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium text-primary text-xs">
                          {product.is_variable_price
                            ? "Variável"
                            : (product.variations && product.variations.length > 0)
                            ? `${formatCurrency(Math.min(product.price, ...product.variations.map(v => v.price)))}+`
                            : formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        <span className="text-muted-foreground text-xs">
                          {product.delivery_price ? formatCurrency(product.delivery_price) : "—"}
                        </span>
                      </td>
                      <td className="p-2 hidden lg:table-cell">
                        {todayCount > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {todayCount}×
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Switch
                          checked={product.available ?? true}
                          onCheckedChange={() => handleToggleProductAvailability(product)}
                          className="scale-75"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openProductDialog(product)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => confirmDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm || filterCategory !== "all" ? "Tente ajustar os filtros" : "Adicione seu primeiro produto"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteDialog.type === "product" ? "Produto" : "Categoria"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteDialog.name}"</strong>?
              {deleteDialog.type === "category"
                ? " Os produtos vinculados ficarão sem categoria."
                : ""}{" "}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.type === "product" ? handleDeleteProduct : handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedProducts.size} produto(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedProducts.size} produto(s)</strong>?
              Esta ação não pode ser desfeita e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir {selectedProducts.size} produto(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
