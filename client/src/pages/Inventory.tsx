import { Layout } from "@/components/Layout";
import { useItems, useCreateItem, useUpdateItem } from "@/hooks/use-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState, useEffect } from "react";
import { Search, Plus, PackageOpen, Filter, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const form = useForm<InsertItem>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: "",
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

  useEffect(() => {
    if (item) {
      form.reset({
        sku: item.sku,
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
        sku: "",
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
            {item ? "Update the details for this item." : "Enter the details for the new item. SKU must be unique."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl><Input placeholder="LAMP-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="Lighting" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
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
                <FormLabel>Image URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} value={field.value || ''} /></FormControl>
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

export default function Inventory() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useItems(search);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

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

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by name, SKU, or category..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
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
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No items found. Try a different search.
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                    <TableCell>
                      <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <PackageOpen className="w-6 h-6 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.vendor}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">${item.price}</TableCell>
                    <TableCell className="text-right font-mono">${item.bwdPrice}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
