import { Layout } from "@/components/Layout";
import { useProjects } from "@/hooks/use-projects";
import { useItems } from "@/hooks/use-items";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Package, Clock, Archive } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: items, isLoading: itemsLoading } = useItems();

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  const recentItems = items?.slice(0, 5) || [];

  return (
    <Layout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back, Jane. Here's what's happening today.</p>
        </div>
        <Link href="/projects">
          <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-white to-neutral-50 border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <Clock className="w-4 h-4 text-primary/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">
              {projectsLoading ? "..." : activeProjects.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-neutral-50 border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory</CardTitle>
            <Package className="w-4 h-4 text-primary/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">
              {itemsLoading ? "..." : items?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-neutral-50 border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Archived</CardTitle>
            <Archive className="w-4 h-4 text-primary/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">
              {projectsLoading ? "..." : projects?.filter(p => p.status === "archived").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Active Projects</h2>
          <Link href="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No active projects currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                <Card className="h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-display text-xl">{project.name}</CardTitle>
                      <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">
                        {project.status}
                      </span>
                    </div>
                    <CardDescription>Client: {project.clientName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Started {format(new Date(project.createdAt || new Date()), 'MMM d, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Quick Inventory Preview */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Recent Inventory Items</h2>
          <Link href="/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itemsLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading inventory...</td></tr>
                ) : recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground/50" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">{item.sku}</td>
                    <td className="px-6 py-3 font-medium">{item.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-6 py-3 text-right font-mono">${item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}
