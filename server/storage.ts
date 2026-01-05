import { db } from "./db";
import {
  items, projects, projectItems,
  type Item, type InsertItem,
  type Project, type InsertProject,
  type ProjectItem, type InsertProjectItem,
  type ProjectWithItemsResponse
} from "@shared/schema";
import { eq, like, desc } from "drizzle-orm";

export interface IStorage {
  // Items
  getItems(search?: string): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  getItemBySku(sku: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<ProjectWithItemsResponse | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;

  // Project Items
  addProjectItem(projectItem: InsertProjectItem): Promise<ProjectItem>;
  updateProjectItem(id: number, updates: Partial<InsertProjectItem>): Promise<ProjectItem>;
  deleteProjectItem(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Items
  async getItems(search?: string): Promise<Item[]> {
    if (search) {
      return await db.select().from(items).where(like(items.name, `%${search}%`));
    }
    return await db.select().from(items).orderBy(desc(items.id));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemBySku(sku: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.sku, sku));
    return item;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
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

  // Project Items
  async addProjectItem(insertProjectItem: InsertProjectItem): Promise<ProjectItem> {
    const [item] = await db.insert(projectItems).values(insertProjectItem).returning();
    return item;
  }

  async updateProjectItem(id: number, updates: Partial<InsertProjectItem>): Promise<ProjectItem> {
    const [updated] = await db.update(projectItems)
      .set(updates)
      .where(eq(projectItems.id, id))
      .returning();
    return updated;
  }

  async deleteProjectItem(id: number): Promise<void> {
    await db.delete(projectItems).where(eq(projectItems.id, id));
  }
}

export const storage = new DatabaseStorage();
