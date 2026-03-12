import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import {
  useAddProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";

function getProductPhoto(id: string): string | null {
  return localStorage.getItem(`product_photo_${id}`);
}
function setProductPhoto(id: string, dataUrl: string | null) {
  if (dataUrl) {
    localStorage.setItem(`product_photo_${id}`, dataUrl);
  } else {
    localStorage.removeItem(`product_photo_${id}`);
  }
}
let pendingPhoto: string | null = null;

export function Products() {
  const { data: products, isLoading, isError } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [addPhoto, setAddPhoto] = useState<string | null>(null);

  const [editId, setEditId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [, setPhotoVersion] = useState(0);

  const addPhotoRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (
    file: File,
    setter: (v: string | null) => void,
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetAdd = () => {
    setName("");
    setPrice("");
    setStock("");
    setAddPhoto(null);
    pendingPhoto = null;
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!price || Number.parseFloat(price) < 0) {
      toast.error("Valid price is required");
      return;
    }
    try {
      pendingPhoto = addPhoto;
      const id = await addProduct.mutateAsync({
        name: name.trim(),
        price: Number.parseFloat(price),
        stock: BigInt(Number.parseInt(stock) || 0),
      });
      if (pendingPhoto) {
        setProductPhoto(id.toString(), pendingPhoto);
        setPhotoVersion((v) => v + 1);
      }
      toast.success("Product added");
      setAddOpen(false);
      resetAdd();
    } catch {
      toast.error("Failed to add product");
    }
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditStock(p.stock.toString());
    setEditPhoto(getProductPhoto(p.id.toString()));
  };

  const handleUpdate = async (id: bigint) => {
    try {
      await updateProduct.mutateAsync({
        id,
        name: editName,
        price: Number.parseFloat(editPrice) || 0,
        stock: BigInt(Number.parseInt(editStock) || 0),
      });
      setProductPhoto(id.toString(), editPhoto);
      setPhotoVersion((v) => v + 1);
      toast.success("Product updated");
      setEditId(null);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteProduct.mutateAsync(id);
      setProductPhoto(id.toString(), null);
      setPhotoVersion((v) => v + 1);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Products
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {products?.length ?? 0} products in inventory
          </p>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) resetAdd();
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="products.add_product.button"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={16} className="mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="products.dialog">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Product Photo (optional)</Label>
                <label
                  className="flex items-center gap-3 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  data-ocid="product.photo.dropzone"
                >
                  {addPhoto ? (
                    <img
                      src={addPhoto}
                      alt="product"
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                      <Camera size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {addPhoto ? "Change photo" : "Upload product photo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG supported
                    </p>
                  </div>
                  <ImagePlus size={18} className="text-muted-foreground" />
                  <input
                    ref={addPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-ocid="product.photo.upload_button"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoSelect(f, setAddPhoto);
                    }}
                  />
                </label>
                {addPhoto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs h-6 px-2"
                    onClick={() => setAddPhoto(null)}
                  >
                    Remove photo
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Label>Product Name</Label>
                <Input
                  data-ocid="product.name.input"
                  placeholder="e.g. Paracetamol 500mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Price (₹)</Label>
                  <Input
                    data-ocid="product.price.input"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock</Label>
                  <Input
                    data-ocid="product.stock.input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="products.cancel_button"
                onClick={() => {
                  setAddOpen(false);
                  resetAdd();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={addProduct.isPending}
                className="pharmacy-gradient text-white border-0"
                data-ocid="products.submit_button"
              >
                {addProduct.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {addProduct.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <div
          data-ocid="products.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load products.
        </div>
      )}

      {isLoading ? (
        <div data-ocid="products.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Photo</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="products.empty_state"
                  >
                    No products yet. Add your first product!
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, idx) => {
                  const photo = getProductPhoto(product.id.toString());
                  const isEditing = editId === product.id;
                  return (
                    <TableRow
                      key={product.id.toString()}
                      data-ocid={`products.item.${idx + 1}`}
                    >
                      <TableCell>
                        {isEditing ? (
                          <label className="h-12 w-12 rounded-md border border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden block">
                            {editPhoto ? (
                              <img
                                src={editPhoto}
                                alt="product"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Camera
                                size={18}
                                className="text-muted-foreground"
                              />
                            )}
                            <input
                              ref={editPhotoRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePhotoSelect(f, setEditPhoto);
                              }}
                            />
                          </label>
                        ) : photo ? (
                          <img
                            src={photo}
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded-md border border-border"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                            <Camera
                              size={16}
                              className="text-muted-foreground/40"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{product.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="h-8 w-24"
                          />
                        ) : (
                          <span className="text-primary font-medium">
                            ₹{product.price.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="h-8 w-20"
                          />
                        ) : (
                          <span
                            className={
                              product.stock <= 5n
                                ? "text-amber-600 font-medium"
                                : ""
                            }
                          >
                            {product.stock.toString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdate(product.id)}
                              className="text-emerald-600 hover:text-emerald-700"
                              data-ocid={`products.save_button.${idx + 1}`}
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditId(null)}
                              data-ocid={`products.cancel_button.${idx + 1}`}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button
                              data-ocid={`products.edit_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(product)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              data-ocid={`products.delete_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
