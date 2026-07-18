import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowUpDown,
  FilterX,
  Download,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  LayoutGrid,
  List,
  FolderInput,
} from "lucide-react";
import { ProductCard } from "@/components/menu/ProductCard";
import { CategoryChips } from "@/components/menu/CategoryChips";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryDialog } from "@/components/menu/CategoryDialog";
import { ProductDialog } from "@/components/menu/ProductDialog";
import { ProductListView } from "@/components/menu/ProductListView";
import type {
  Category,
  Product,
  ProductVariation,
  SortOption,
  AvailabilityFilter,
  ViewMode,
  VariationFormItem,
  ProductFormState,
  CategoryFormState,
} from "@/types/menu";

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
  const [productForm, setProductForm] = useState<ProductFormState>({
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
  const [formError, setFormError] = useState<string | null>(null);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
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
        supabase
          .from("product_variations")
          .select("*, products!inner(unit_id)")
          .eq("products.unit_id", selectedUnit.id)
          .order("sort_order"),
        supabase
          .from("order_items")
          .select("product_id, quantity, orders!inner(unit_id, created_at)")
          .eq("orders.unit_id", selectedUnit.id)
          .gte("orders.created_at", startOfToday.toISOString())
          .not("product_id", "is", null),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;

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

  const invalidateRelatedCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }, [queryClient]);

  // Image upload
  const handleImageSelect = (file: File) => {
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

  const avgPrice = useMemo(() => {
    const fixedPriceProducts = products.filter((p) => !p.is_variable_price && p.price > 0);
    if (fixedPriceProducts.length === 0) return 0;
    return fixedPriceProducts.reduce((sum, p) => sum + p.price, 0) / fixedPriceProducts.length;
  }, [products]);

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
          <Button variant="outline" size="sm" onClick={() => openCategoryDialog()}>
            <FolderOpen className="w-4 h-4 mr-1" />
            Categoria
          </Button>
          <Button size="sm" onClick={() => openProductDialog()}>
            <Plus className="w-4 h-4 mr-1" />
            Produto
          </Button>
        </div>
      </div>

      {/* Dialogs (controlados por estado) */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        onFormChange={setCategoryForm}
        onSubmit={handleSaveCategory}
        onDelete={confirmDeleteCategory}
        saving={savingCategory}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingProduct={editingProduct}
        categories={categories}
        productForm={productForm}
        onFormChange={setProductForm}
        variationsForm={variationsForm}
        onAddVariation={addVariation}
        onUpdateVariation={updateVariation}
        onRemoveVariation={removeVariation}
        imagePreview={imagePreview}
        onImageSelect={handleImageSelect}
        onRemoveImage={removeImage}
        formError={formError}
        saving={savingProduct}
        uploadingImage={uploadingImage}
        onSubmit={handleSaveProduct}
      />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total de Produtos" value={products.length} icon={Package} iconColor="primary" />
        <StatCard title="Disponíveis" value={`${availableCount}/${products.length}`} icon={CheckCircle2} iconColor="success" />
        <StatCard title="Categorias" value={categories.filter((c) => c.active !== false).length} icon={Tags} iconColor="info" />
        <StatCard title="Preço Médio" value={formatCurrency(avgPrice)} icon={DollarSign} iconColor="warning" />
      </div>

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
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("activate")} disabled={bulkProcessing}>
                <Power className="w-3.5 h-3.5 mr-1" />
                Ativar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("deactivate")} disabled={bulkProcessing}>
                <PowerOff className="w-3.5 h-3.5 mr-1" />
                Desativar
              </Button>
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
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")} disabled={bulkProcessing}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir ({selectedProducts.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} resultado(s) encontrado(s)
        </p>
      )}

      {/* Products */}
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
          <ProductListView
            filteredProducts={filteredProducts}
            selectedProducts={selectedProducts}
            topProductIds={topProductIds}
            orderCounts={orderCounts}
            onToggleSelect={toggleSelectProduct}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onEdit={openProductDialog}
            onDelete={confirmDeleteProduct}
            onToggleAvailability={handleToggleProductAvailability}
            formatCurrency={formatCurrency}
          />
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
