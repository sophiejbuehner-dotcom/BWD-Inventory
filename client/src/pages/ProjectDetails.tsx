import { Layout } from "@/components/Layout";
import { useParams, Link, useLocation } from "wouter";
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useItems } from "@/hooks/use-items";
import { useAddProjectItem, useUpdateProjectItem, useDeleteProjectItem } from "@/hooks/use-project-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ArrowLeft, Search, Download, Trash2, Plus, Loader2, PackageOpen, Archive, MoreVertical, Edit2, Check, Calendar } from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import type { Item } from "@shared/schema";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const updateProjectMutation = useUpdateProject(projectId);
  const deleteProjectMutation = useDeleteProject();
  const addMutation = useAddProjectItem(projectId);
  const updateMutation = useUpdateProjectItem(projectId);
  const deleteMutation = useDeleteProjectItem(projectId);

  // Add Item Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  
  // Edit Item Modal State
  const [editingProjectItem, setEditingProjectItem] = useState<{ id: number, quantity: number, notes: string | null, item: { name: string, quantity: number } } | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  // Fetch all items for the add dialog
  const { data: allItems, isLoading: itemsLoading } = useItems();

  const categories = [
    "all",
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
  
  const filteredItems = allItems?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      item.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setItemQuantity(1);
  };

  const handleAddItem = async () => {
    if (!selectedItem) return;
    try {
      await addMutation.mutateAsync({ itemId: selectedItem.id, quantity: itemQuantity, status: "pulled" });
      toast({ title: "Item Added", description: `${selectedItem.name} added to project list.` });
      setShowAddDialog(false);
      setSelectedItem(null);
      setSearchTerm("");
      setSelectedCategory("all");
      setItemQuantity(1);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    }
  };

  const handleArchiveProject = async () => {
    if (confirm("Are you sure you want to archive this project?")) {
      try {
        await updateProjectMutation.mutateAsync({ status: "archived" });
        toast({ title: "Project Archived" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to archive project.", variant: "destructive" });
      }
    }
  };

  const handleDeleteProject = async () => {
    if (confirm("DANGER: Are you sure you want to PERMANENTLY DELETE this project and all its pull list items? This cannot be undone.")) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
        toast({ title: "Project Deleted" });
        setLocation("/projects");
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
      }
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ itemId, updates: { status: newStatus } });
      toast({ title: "Status Updated" });
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (itemId: number) => {
    if (confirm("Are you sure you want to remove this item?")) {
      try {
        await deleteMutation.mutateAsync(itemId);
        toast({ title: "Item Removed" });
      } catch (error) {
        toast({ title: "Remove Failed", variant: "destructive" });
      }
    }
  };

  const exportCSV = () => {
    if (!project?.items) return;
    const data = project.items.map(pi => ({
      Name: pi.item.name,
      Category: pi.item.category,
      Vendor: pi.item.vendor,
      "Client Price": pi.item.price,
      "BWD Price": pi.item.bwdPrice || '0.00',
      Cost: pi.item.cost,
      Status: pi.status,
      Notes: pi.notes || ""
    }));
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_pull_list.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateItem = async () => {
    if (!editingProjectItem) return;
    try {
      await updateMutation.mutateAsync({ 
        itemId: editingProjectItem.id, 
        updates: { quantity: editQuantity, notes: editNotes } 
      });
      toast({ title: "Item Updated" });
      setEditingProjectItem(null);
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const calculateTotal = () => {
    if (!project?.items) return 0;
    return project.items.reduce((sum, pi) => {
      if (pi.status === 'returned') return sum;
      return sum + (Number(pi.item.price || 0) * pi.quantity);
    }, 0);
  };

  const projectTotal = calculateTotal();

  if (projectLoading) return <Layout><div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div></Layout>;
  if (!project) return <Layout><div>Project not found</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/projects" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">{project.name}</h1>
          <p className="text-xl text-muted-foreground mt-1">{project.clientName}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project Total:</span>
            <span className="text-2xl font-bold text-primary font-mono">${projectTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
             <Download className="w-4 h-4 mr-2" /> Export CSV
           </Button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="default" className="bg-primary text-primary-foreground" data-testid="button-edit-project">
                 Edit Project <MoreVertical className="ml-2 w-4 h-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {project.status !== 'archived' && (
                 <DropdownMenuItem onClick={handleArchiveProject} data-testid="menu-archive-project">
                   <Archive className="w-4 h-4 mr-2" /> Archive Project
                 </DropdownMenuItem>
               )}
               <DropdownMenuItem onClick={handleDeleteProject} className="text-destructive focus:text-destructive" data-testid="menu-delete-project">
                 <Trash2 className="w-4 h-4 mr-2" /> Delete Project
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </header>

      {/* Add Item Button */}
      <div className="mb-8">
        <Button size="lg" onClick={() => setShowAddDialog(true)} data-testid="button-add-item">
          <Plus className="w-5 h-5 mr-2" /> Add Item to Project
        </Button>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setSelectedItem(null);
          setSearchTerm("");
          setSelectedCategory("all");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Item to Project</DialogTitle>
            <DialogDescription>Search by name, category, or browse the inventory list.</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-items"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 border rounded-lg">
              {itemsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <PackageOpen className="w-10 h-10 mb-2" />
                  <p>No items found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredItems?.map((item) => {
                    const isUnavailable = item.quantity <= 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isUnavailable && handleSelectItem(item)}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          isUnavailable
                            ? "opacity-50 cursor-not-allowed"
                            : selectedItem?.id === item.id
                              ? "bg-primary/10 border border-primary cursor-pointer"
                              : "hover:bg-muted cursor-pointer"
                        }`}
                        data-testid={`item-row-${item.id}`}
                      >
                        <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <PackageOpen className="w-6 h-6 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            <span>{item.vendor}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono font-medium">${item.price}</div>
                          {isUnavailable ? (
                            <Badge variant="outline" className="text-xs text-destructive border-destructive">
                              Unavailable
                            </Badge>
                          ) : (
                            <div className="text-sm text-muted-foreground">Available: {item.quantity}</div>
                          )}
                        </div>
                        {selectedItem?.id === item.id && !isUnavailable && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Selected Item Quantity */}
            {selectedItem && (
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{selectedItem.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedItem.vendor} - ${selectedItem.price}
                    <span className="ml-2 text-xs">({selectedItem.quantity} available)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Quantity:</label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={itemQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setItemQuantity(Math.min(val, selectedItem.quantity));
                    }}
                    className="w-20"
                    data-testid="input-quantity"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel-add">Cancel</Button>
            <Button onClick={handleAddItem} disabled={!selectedItem || addMutation.isPending} data-testid="button-confirm-add">
              {addMutation.isPending ? "Adding..." : "Add to Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Items Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Pull List</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pulled Date</TableHead>
              <TableHead className="text-right">Client Price</TableHead>
              <TableHead className="text-right">BWD Price</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No items in this project yet. Click "Add Item to Project" to start.
                </TableCell>
              </TableRow>
            ) : (
              project.items.map((pi) => (
                <TableRow key={pi.id} data-testid={`project-item-${pi.id}`}>
                  <TableCell>
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                      {pi.item.imageUrl ? (
                        <img src={pi.item.imageUrl} alt={pi.item.name} className="w-full h-full object-cover" />
                      ) : (
                        <PackageOpen className="w-6 h-6 text-muted-foreground/50" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pi.item.name}</div>
                      <div className="text-xs text-muted-foreground">{pi.item.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>{pi.item.vendor}</TableCell>
                  <TableCell className="text-center font-medium">{pi.quantity}</TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={pi.status} 
                      onValueChange={(val) => handleStatusChange(pi.id, val)}
                    >
                      <SelectTrigger className={`w-[130px] h-8 border-none font-medium ${
                        pi.status === 'pulled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        pi.status === 'installed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        pi.status === 'returned' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`} data-testid={`status-select-${pi.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pulled">Pulled</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {pi.addedAt ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(pi.addedAt), "MMM d, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">${pi.item.price}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">${pi.item.bwdPrice || '0.00'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingProjectItem(pi);
                        setEditQuantity(pi.quantity);
                        setEditNotes(pi.notes || "");
                      }}
                      data-testid={`button-edit-${pi.id}`}
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

      {/* Edit Project Item Modal */}
      <Dialog open={!!editingProjectItem} onOpenChange={(open) => !open && setEditingProjectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item Details</DialogTitle>
            <DialogDescription>Update quantity or remove from project.</DialogDescription>
          </DialogHeader>
          {editingProjectItem && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-bold">{editingProjectItem.item.name}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  data-testid="input-edit-quantity"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  data-testid="input-edit-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editingProjectItem) {
                  handleDelete(editingProjectItem.id);
                  setEditingProjectItem(null);
                }
              }}
              data-testid="button-remove-item"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingProjectItem(null)} data-testid="button-cancel-edit">Cancel</Button>
              <Button onClick={handleUpdateItem} disabled={updateMutation.isPending} data-testid="button-save-edit">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
