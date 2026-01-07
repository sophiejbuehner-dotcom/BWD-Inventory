import { db } from "./db";
import {
  items, projects, projectItems,
  type Item, type InsertItem,
  type Project, type InsertProject,
  type ProjectItem, type InsertProjectItem,
  type ProjectWithItemsResponse
} from "@shared/schema";
import { eq, ilike, desc, or } from "drizzle-orm";

export interface IStorage {
  // Items
  getItems(search?: string): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, updates: Partial<InsertItem>): Promise<Item>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<ProjectWithItemsResponse | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Project Items
  addProjectItem(projectItem: InsertProjectItem): Promise<ProjectItem>;
  updateProjectItem(id: number, updates: Partial<InsertProjectItem>): Promise<ProjectItem>;
  deleteProjectItem(id: number): Promise<void>;
  getActiveProjectItemsForItem(itemId: number): Promise<Array<{ projectName: string; quantity: number; status: string; addedAt: Date | null }>>;
}

export class DatabaseStorage implements IStorage {
  // Items
  async getItems(search?: string): Promise<Item[]> {
    if (search) {
      return await db.select().from(items).where(
        or(
          ilike(items.name, `%${search}%`),
          ilike(items.category, `%${search}%`),
          ilike(items.vendor, `%${search}%`)
        )
      ).orderBy(desc(items.id));
    }
    return await db.select().from(items).orderBy(desc(items.id));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async updateItem(id: number, updates: Partial<InsertItem>): Promise<Item> {
    const [updated] = await db.update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    if (!updated) throw new Error("Item not found");
    return updated;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<ProjectWithItemsResponse | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const itemsInProject = await db.query.projectItems.findMany({
      where: eq(projectItems.projectId, id),
      with: {
        item: true
      }
    });

    return { ...project, items: itemsInProject };
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    if (!updated) throw new Error("Project not found");
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    // Delete related project items first
    await db.delete(projectItems).where(eq(projectItems.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Items
  async addProjectItem(insertProjectItem: InsertProjectItem): Promise<ProjectItem> {
    const [item] = await db.insert(projectItems).values(insertProjectItem).returning();
    
    // Deduct quantity from master inventory
    const [currentMasterItem] = await db.select().from(items).where(eq(items.id, insertProjectItem.itemId));
    if (currentMasterItem) {
      const quantityToDeduct = insertProjectItem.quantity ?? 1;
      const newQuantity = Math.max(0, currentMasterItem.quantity - quantityToDeduct);
      await db.update(items)
        .set({ quantity: newQuantity })
        .where(eq(items.id, insertProjectItem.itemId));
    }
    
    return item;
  }

  async updateProjectItem(id: number, updates: Partial<InsertProjectItem>): Promise<ProjectItem> {
    const [existing] = await db.select().from(projectItems).where(eq(projectItems.id, id));
    if (!existing) throw new Error("Project item not found");

    const [updated] = await db.update(projectItems)
      .set(updates)
      .where(eq(projectItems.id, id))
      .returning();

    const [masterItem] = await db.select().from(items).where(eq(items.id, existing.itemId));
    if (masterItem) {
      // Handle Quantity Changes
      if (updates.quantity !== undefined && updates.quantity !== existing.quantity) {
        // If status is returned, quantity doesn't affect stock (it's already in stock)
        // If status is NOT returned, we need to adjust stock
        if (existing.status !== 'returned' && (updates.status === undefined || updates.status !== 'returned')) {
          const diff = updates.quantity - existing.quantity;
          await db.update(items)
            .set({ quantity: Math.max(0, masterItem.quantity - diff) })
            .where(eq(items.id, existing.itemId));
        }
      }

      // Handle Status Changes (Returned logic)
      if (updates.status === 'returned' && existing.status !== 'returned') {
        // Just returned: Add back current quantity to stock
        await db.update(items)
          .set({ quantity: masterItem.quantity + (updates.quantity ?? existing.quantity) })
          .where(eq(items.id, existing.itemId));
      } else if (updates.status !== 'returned' && existing.status === 'returned' && updates.status !== undefined) {
        // Re-pulled: Subtract current quantity from stock
        await db.update(items)
          .set({ quantity: Math.max(0, masterItem.quantity - (updates.quantity ?? existing.quantity)) })
          .where(eq(items.id, existing.itemId));
      }
    }
    
    return updated;
  }

  async deleteProjectItem(id: number): Promise<void> {
    const [existing] = await db.select().from(projectItems).where(eq(projectItems.id, id));
    if (existing && existing.status !== 'returned') {
      // If deleting an item that wasn't returned, add back to stock
      const [masterItem] = await db.select().from(items).where(eq(items.id, existing.itemId));
      if (masterItem) {
        await db.update(items)
          .set({ quantity: masterItem.quantity + existing.quantity })
          .where(eq(items.id, existing.itemId));
      }
    }
    await db.delete(projectItems).where(eq(projectItems.id, id));
  }

  async getActiveProjectItemsForItem(itemId: number): Promise<Array<{ projectName: string; quantity: number; status: string; addedAt: Date | null }>> {
    const results = await db.query.projectItems.findMany({
      where: eq(projectItems.itemId, itemId),
      with: {
        project: true
      }
    });
    
    return results
      .filter(pi => pi.status !== 'returned')
      .map(pi => ({
        projectName: pi.project.name,
        quantity: pi.quantity,
        status: pi.status,
        addedAt: pi.addedAt
      }));
  }
}

export const storage = new DatabaseStorage();
