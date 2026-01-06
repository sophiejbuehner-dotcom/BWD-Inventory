import { Layout } from "@/components/Layout";
import { useParams, Link, useLocation } from "wouter";
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useItemBySku } from "@/hooks/use-items";
import { useAddProjectItem, useUpdateProjectItem, useDeleteProjectItem } from "@/hooks/use-project-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useState, useEffect } from "react";
import { ArrowLeft, Search, Download, Trash2, Plus, Loader2, PackageOpen, Archive, MoreVertical, Edit2 } from "lucide-react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";

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

  // Quick Add State
  const [skuInput, setSkuInput] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [debouncedSku, setDebouncedSku] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingProjectItem, setEditingProjectItem] = useState<{ id: number, quantity: number, notes: string | null, item: { name: string, sku: string, quantity: number } } | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState("");
  
  // Debounce SKU input for query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSku(skuInput), 500);
    return () => clearTimeout(timer);
  }, [skuInput]);

  const { data: foundItem, isLoading: isSearching, isError: isSearchError } = useItemBySku(debouncedSku);

  useEffect(() => {
    if (foundItem && !showConfirmModal) {
      setShowConfirmModal(true);
    }
  }, [foundItem]);

  const handleAddItem = async () => {
    if (!foundItem) return;
    try {
      await addMutation.mutateAsync({ itemId: foundItem.id, quantity: itemQuantity, status: "pulled" });
      toast({ title: "Item Added", description: `${foundItem.name} added to project list.` });
      setSkuInput("");
      setDebouncedSku("");
      setItemQuantity(1);
      setShowConfirmModal(false);
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
      SKU: pi.item.sku,
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
           <Button variant="outline" onClick={exportCSV}>
             <Download className="w-4 h-4 mr-2" /> Export CSV
           </Button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="default" className="bg-primary text-primary-foreground">
                 Edit Project <MoreVertical className="ml-2 w-4 h-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {project.status !== 'archived' && (
                 <DropdownMenuItem onClick={handleArchiveProject}>
                   <Archive className="w-4 h-4 mr-2" /> Archive Project
                 </DropdownMenuItem>
               )}
               <DropdownMenuItem onClick={handleDeleteProject} className="text-destructive focus:text-destructive">
                 <Trash2 className="w-4 h-4 mr-2" /> Delete Project
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </header>

      {/* Quick Add Bar */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Scan or type SKU to add item..." 
              className="pl-10 py-6 text-lg font-mono bg-background"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground hidden md:block">
            Press Enter or scan barcode
          </div>
        </div>
        {isSearchError && skuInput.length > 2 && (
          <p className="text-red-500 text-sm mt-2 ml-2">Item not found with SKU: {skuInput}</p>
        )}
      </div>

      {/* Confirmation Modal for Quick Add */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => {
        setShowConfirmModal(open);
        if (!open) setSkuInput(""); 
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Project?</DialogTitle>
            <DialogDescription>Confirm adding this item to the pull list.</DialogDescription>
          </DialogHeader>
          {foundItem && (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {foundItem.imageUrl ? (
                    <img src={foundItem.imageUrl} alt={foundItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <PackageOpen className="w-10 h-10 m-auto text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{foundItem.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{foundItem.sku}</p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Vendor:</span> {foundItem.vendor}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">In Stock:</span> {foundItem.quantity}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Price:</span> ${foundItem.price}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity to Pull</label>
                <Input
                  type="number"
                  min="1"
                  max={foundItem.quantity}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                />
                {itemQuantity > foundItem.quantity && (
                  <p className="text-sm text-destructive">Warning: Requested quantity exceeds stock.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={addMutation.isPending}>
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
              <TableHead className="text-right">Client Price</TableHead>
              <TableHead className="text-right">BWD Price</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No items in this project yet. Scan a SKU above to start.
                </TableCell>
              </TableRow>
            ) : (
              project.items.map((pi) => (
                <TableRow key={pi.id}>
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
                      <div className="text-xs text-muted-foreground font-mono">{pi.item.sku}</div>
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
                        pi.status === 'pulled' ? 'bg-blue-100 text-blue-700' :
                        pi.status === 'installed' ? 'bg-green-100 text-green-700' :
                        pi.status === 'returned' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pulled">Pulled</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
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
                <p className="text-sm text-muted-foreground font-mono">{editingProjectItem.item.sku}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
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
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingProjectItem(null)}>Cancel</Button>
              <Button onClick={handleUpdateItem} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
