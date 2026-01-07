import { Layout } from "@/components/Layout";
import { useItems, useCreateItem, useUpdateItem, useItemProjectAssignments } from "@/hooks/use-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemSchema, type InsertItem, type Item } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { Search, Plus, PackageOpen, Edit2, ChevronDown, ChevronUp, Calendar, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useUpload } from "@/hooks/use-upload";

const CATEGORIES = [
  "Found/Wood Accessories",
  "Furniture",
  "Hardware",
  "Lighting",
  "Pillows/Bedding",
  "Plants",
  "Rugs",
  "BBH Misc",
  "Stoneware/Ceramics",
  "Woven Baskets",
  "Wallpaper",
  "Fabric"
];

// Helper to coerce number strings
const formSchema = insertItemSchema.extend({
  cost: insertItemSchema.shape.cost,
  price: insertItemSchema.shape.price,
  bwdPrice: insertItemSchema.shape.bwdPrice,
});

function ItemDialog({ 
  item, 
  open, 
  onOpenChange 
}: { 
  item?: Item; 
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) {
  const { toast } = useToast();
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(item?.id || 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      form.setValue("imageUrl", response.objectPath);
      toast({ title: "Image Uploaded", description: "Photo uploaded successfully." });
    },
    onError: (error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<InsertItem>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      vendor: "",
      cost: "0",
      price: "0",
      bwdPrice: "0",
      category: "",
      description: "",
      imageUrl: "",
      quantity: 0,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  };

  const currentImageUrl = form.watch("imageUrl");

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        vendor: item.vendor,
        cost: item.cost,
        price: item.price,
        bwdPrice: item.bwdPrice,
        category: item.category || "",
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        quantity: item.quantity || 0,
      });
    } else {
      form.reset({
        name: "",
        vendor: "",
        cost: "0",
        price: "0",
        bwdPrice: "0",
        category: "",
        description: "",
        imageUrl: "",
        quantity: 0,
      });
    }
  }, [item, form]);

  const onSubmit = async (data: InsertItem) => {
    try {
      if (item) {
        await updateMutation.mutateAsync(data);
        toast({ title: "Item Updated", description: `${data.name} updated successfully.` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Item Created", description: `${data.name} added to inventory.` });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the details for this item." : "Enter the details for the new item."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-item-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl><Input placeholder="Mid-century Table Lamp" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="vendor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl><Input placeholder="West Elm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Price ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bwdPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>BWD Price ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Photo (Optional)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-item-image"
                    />
                    
                    {currentImageUrl ? (
                      <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                        <img 
                          src={currentImageUrl.startsWith('/objects/') ? currentImageUrl : currentImageUrl} 
                          alt="Item preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute top-1 right-1"
                          onClick={() => form.setValue("imageUrl", "")}
                          data-testid="button-remove-image"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        data-testid="button-upload-image"
                      >
                        {isUploading ? (
                          <>
                            <Upload className="w-6 h-6 animate-pulse" />
                            <span className="text-sm">Uploading... {progress}%</span>
                          </>
                        ) : (
                          <>
                            <Image className="w-6 h-6" />
                            <span className="text-sm">Tap to upload photo</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (item ? "Update Item" : "Create Item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function InventoryRow({ item, onEdit }: { item: Item; onEdit: (item: Item) => void }) {
  const { data: assignments } = useItemProjectAssignments(item.id);
  const [expanded, setExpanded] = useState(false);

  const hasAssignments = assignments && assignments.length > 0;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors group" data-testid={`inventory-row-${item.id}`}>
      <TableCell>
        <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <PackageOpen className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell>{item.vendor}</TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell>
        {hasAssignments ? (
          <div className="space-y-1">
            {assignments.slice(0, expanded ? undefined : 2).map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {a.status === 'pulled' ? 'Pulled' : 'Installed'}
                </Badge>
                <span className="text-foreground font-medium">{a.projectName}</span>
                <span className="text-muted-foreground">x{a.quantity}</span>
                {a.addedAt && (
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(a.addedAt), "MMM d")}
                  </span>
                )}
              </div>
            ))}
            {assignments.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-xs text-primary flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> +{assignments.length - 2} more
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-right font-mono">${item.price}</TableCell>
      <TableCell className="text-right font-mono">${item.bwdPrice}</TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          data-testid={`button-edit-item-${item.id}`}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: items, isLoading } = useItems(search);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  const categories = [
    "All",
    "Found/Wood Accessories",
    "Furniture",
    "Hardware",
    "Lighting",
    "Pillows/Bedding",
    "Plants",
    "Rugs",
    "BBH Misc",
    "Stoneware/Ceramics",
    "Woven Baskets",
    "Wallpaper",
    "Fabric"
  ];

  const filteredItems = items?.filter(item => {
    if (selectedCategory === "All") return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your complete catalog of accessories and furniture.</p>
        </div>
        
        <Button size="lg" className="shadow-lg" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" /> Add New Item
        </Button>

        <ItemDialog 
          item={editingItem} 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingItem(undefined);
          }} 
        />
      </header>

      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by name or category..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-muted p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? "bg-background text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid={`tab-category-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead>Pulled For</TableHead>
                <TableHead className="text-right">Client Price</TableHead>
                <TableHead className="text-right">BWD Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    Loading catalog...
                  </TableCell>
                </TableRow>
              ) : filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No items found. Try a different search or category.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => (
                  <InventoryRow key={item.id} item={item} onEdit={handleEdit} />
                ))
              )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
