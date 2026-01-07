import { Layout } from "@/components/Layout";
import { useExpenses, useExpenseSummary, useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type InsertExpense, type Expense } from "@shared/schema";
import { useState } from "react";
import { Plus, DollarSign, TrendingUp, Receipt, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { z } from "zod";

const categories = [
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
  "Fabric",
  "Other"
];

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.string().min(1, "Unit cost is required"),
  totalCost: z.string().min(1, "Total cost is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Audit() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: summary } = useExpenseSummary();
  const createMutation = useCreateExpense();
  const deleteMutation = useDeleteExpense();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      vendor: "",
      category: "",
      quantity: 1,
      unitCost: "0.00",
      totalCost: "0.00",
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: "",
      notes: "",
    },
  });

  const watchQuantity = form.watch("quantity");
  const watchUnitCost = form.watch("unitCost");

  const updateTotalCost = () => {
    const qty = watchQuantity || 1;
    const unit = parseFloat(watchUnitCost) || 0;
    form.setValue("totalCost", (qty * unit).toFixed(2));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        invoiceNumber: data.invoiceNumber || null,
        notes: data.notes || null,
        itemId: null,
        projectId: null,
      });
      toast({ title: "Expense Added", description: "Expense recorded successfully." });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Expense Deleted" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
      }
    }
  };

  const filteredExpenses = expenses?.filter(expense => {
    const matchesCategory = selectedCategory === "all" || 
      expense.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">Audit of Goods</h1>
          <p className="text-muted-foreground mt-1">Track purchases and expenses for your inventory.</p>
        </div>
        
        <Button size="lg" className="shadow-lg" onClick={() => setIsDialogOpen(true)} data-testid="button-add-expense">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ${summary ? summary.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary ? summary.expenseCount : 0}</div>
            <p className="text-xs text-muted-foreground">Recorded transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Unit Cost</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ${summary ? summary.avgUnitCost.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per item average</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-sm w-full">
            <Input 
              placeholder="Search expenses..." 
              className="pl-4 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-expenses"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]" data-testid="select-expense-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : filteredExpenses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No expenses found. Click "Add Expense" to record a purchase.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses?.map((expense) => (
                <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(expense.purchaseDate), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.description}</div>
                    {expense.invoiceNumber && (
                      <div className="text-xs text-muted-foreground">Inv: {expense.invoiceNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{expense.category}</Badge>
                  </TableCell>
                  <TableCell>{expense.vendor}</TableCell>
                  <TableCell className="text-center">{expense.quantity}</TableCell>
                  <TableCell className="text-right font-mono">${expense.unitCost}</TableCell>
                  <TableCell className="text-right font-mono font-medium">${expense.totalCost}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      data-testid={`button-delete-expense-${expense.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new purchase or expense.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="What was purchased..." {...field} data-testid="input-expense-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl><Input placeholder="Vendor name" {...field} data-testid="input-expense-vendor" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-new-expense-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={e => {
                          field.onChange(parseInt(e.target.value) || 1);
                          setTimeout(updateTotalCost, 0);
                        }}
                        data-testid="input-expense-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={e => {
                          field.onChange(e.target.value);
                          setTimeout(updateTotalCost, 0);
                        }}
                        data-testid="input-expense-unit-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="totalCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} readOnly className="bg-muted" data-testid="input-expense-total" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-expense-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice # (optional)</FormLabel>
                    <FormControl><Input placeholder="INV-001" {...field} data-testid="input-expense-invoice" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Input placeholder="Additional notes..." {...field} data-testid="input-expense-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-expense">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-expense">
                  {createMutation.isPending ? "Saving..." : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
