import { useEffect, useState, useMemo, useRef } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { ProductCard } from "@/components/menu/ProductCard";
import { CategoryChips } from "@/components/menu/CategoryChips";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
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
  categories?: Category;
}

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "recent";

export default function Menu() {
  const { selectedUnit } = useUnit();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

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
  });
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
      const [categoriesRes, productsRes] = await Promise.all([
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
      ]);
      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;
      setCategories(categoriesRes.data || []);
      setProducts(productsRes.data || []);
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
      });
      setImagePreview(product.image_url || null);
      setImageFile(null);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        delivery_price: "",
        category_id: "",
        preparation_time: "15",
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setSavingProduct(true);
    try {
      let imageUrl: string | null | undefined = undefined;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage();
      } else if (imagePreview === null && editingProduct?.image_url) {
        // Image was removed
        imageUrl = null;
      }

      const baseData = {
        unit_id: selectedUnit.id,
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        delivery_price: productForm.delivery_price ? parseFloat(productForm.delivery_price) : null,
        category_id: productForm.category_id || null,
        preparation_time: parseInt(productForm.preparation_time) || 15,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      };

      if (editingProduct) {
        const { error } = await supabase.from("products").update(baseData).eq("id", editingProduct.id);
        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        const { error } = await supabase.from("products").insert(baseData);
        if (error) throw error;
        toast.success("Produto criado!");
      }
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
      return matchesSearch && matchesCategory;
    });

    // Sort
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
  }, [products, searchTerm, filterCategory, sortBy]);

  const hasActiveFilters = searchTerm || filterCategory !== "all" || sortBy !== "name-asc";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setSortBy("name-asc");
  };

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
        <div className="flex gap-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0,00"
                        required
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
        />
      )}

      {/* Search + Sort */}
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
        <div className="flex gap-2">
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

      {/* Results indicator */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} resultado(s) encontrado(s)
        </p>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openProductDialog}
              onDelete={confirmDeleteProduct}
              onToggleAvailability={handleToggleProductAvailability}
              formatCurrency={formatCurrency}
              index={index}
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
