import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUnit } from "@/contexts/UnitContext";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Order counts
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
          .select("*")
          .in(
            "product_id",
            (await supabase.from("products").select("id").eq("unit_id", selectedUnit.id)).data?.map(
              (p) => p.id
            ) || []
          )
          .order("sort_order"),
        supabase
          .from("order_items")
          .select("product_id, quantity")
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

      // Count orders per product
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
      // Load variations
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
        // Mark for deletion
        return prev.map((v, i) => (i === index ? { ...v, _deleted: true } : v));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
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
        name: productForm.name,
        description: productForm.description || null,
        price: productForm.is_variable_price ? 0 : (productForm.price ? parseFloat(productForm.price) : 0),
        delivery_price: productForm.delivery_price ? parseFloat(productForm.delivery_price) : null,
        category_id: productForm.category_id || null,
        preparation_time: parseInt(productForm.preparation_time) || 15,
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

      // Delete removed variations
      if (deletedVariations.length > 0) {
        await supabase
          .from("product_variations")
          .delete()
          .in("id", deletedVariations.map((v) => v.id!));
      }

      // Upsert active variations
      for (let i = 0; i < activeVariations.length; i++) {
        const v = activeVariations[i];
        if (!v.name || !v.price) continue;
        const varData = {
          product_id: productId,
          name: v.name,
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

      // Copy variations
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
    setBulkProcessing(true);
    try {
      const ids = Array.from(selectedProducts);
      if (action === "delete") {
        const { error } = await supabase.from("products").delete().in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} produto(s) excluído(s)!`);
      } else {
        const available = action === "activate";
        const { error } = await supabase
          .from("products")
          .update({ available })
          .in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} produto(s) ${available ? "ativado(s)" : "desativado(s)"}!`);
      }
      clearSelection();
      fetchData();
    } catch {
      toast.error("Erro na ação em lote");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Nome", "Categoria", "Preço", "Preço Delivery", "Disponível", "Tempo Preparo", "Variações"];
    const rows = products.map((p) => {
      const vars = (p.variations || []).map((v) => `${v.name}: R$${v.price.toFixed(2)}`).join("; ");
      return [
        p.name,
        p.categories?.name || "Sem categoria",
        p.price.toFixed(2),
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
        name: categoryForm.name,
        description: categoryForm.description || null,
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
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleCategoryReorder = (reorderedCategories: Category[]) => {
    setCategories(reorderedCategories);
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
    if (products.length === 0) return 0;
    return products.reduce((sum, p) => sum + p.price, 0) / products.length;
  }, [products]);

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
                      <Label>Tempo de Preparo (min)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={productForm.preparation_time}
                        onChange={(e) => setProductForm({ ...productForm, preparation_time: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Variations Section */}
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
                          <div className="w-24 space-y-1">
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
        <StatCard
          title="Preço Médio"
          value={formatCurrency(avgPrice)}
          icon={DollarSign}
          iconColor="warning"
        />
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <CategoryChips
          categories={categories}
          filterCategory={filterCategory}
          onFilterChange={setFilterCategory}
          onEditCategory={openCategoryDialog}
          productCounts={productCounts}
          onReorder={handleCategoryReorder}
        />
      )}

      {/* Search + Sort + Filters */}
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
        <div className="flex gap-2 flex-wrap">
          {/* Availability filter */}
          <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}>
            <SelectTrigger className="w-[140px]">
              {availabilityFilter === "all" ? <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" /> : availabilityFilter === "available" ? <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
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
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
              <FilterX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk selection bar */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
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
            <div className="flex gap-1.5">
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction("delete")}
                disabled={bulkProcessing}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir
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

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
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
            />
          ))}
        </div>
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
    </div>
  );
}
