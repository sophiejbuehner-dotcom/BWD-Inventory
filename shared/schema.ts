import { pgTable, text, serial, integer, boolean, timestamp, numeric, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Master Inventory Catalog
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Client price
  bwdPrice: decimal("bwd_price", { precision: 10, scale: 2 }).notNull().default("0.00"), // BWD price
  category: text("category").notNull(), // e.g., Furniture, Lighting, Decor
  imageUrl: text("image_url"),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  status: text("status").notNull().default("active"), // active, completed, archived
  createdAt: timestamp("created_at").defaultNow(),
});

// Items assigned to a Project (The "Pull List")
export const projectItems = pgTable("project_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("pulled"), // pulled, returned, installed
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow(),
});

// === RELATIONS ===
export const projectRelations = relations(projects, ({ many }) => ({
  items: many(projectItems),
}));

export const itemRelations = relations(items, ({ many }) => ({
  projectItems: many(projectItems),
}));

export const projectItemsRelations = relations(projectItems, ({ one }) => ({
  project: one(projects, {
    fields: [projectItems.projectId],
    references: [projects.id],
  }),
  item: one(items, {
    fields: [projectItems.itemId],
    references: [items.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertProjectItemSchema = createInsertSchema(projectItems).omit({ id: true, addedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectItem = typeof projectItems.$inferSelect;
export type InsertProjectItem = z.infer<typeof insertProjectItemSchema>;

// Request types
export type CreateItemRequest = InsertItem;
export type CreateProjectRequest = InsertProject;
export type AddProjectItemRequest = InsertProjectItem;
export type UpdateProjectItemRequest = Partial<InsertProjectItem>;

// Response types
export type ItemResponse = Item;
export type ProjectResponse = Project;
export type ProjectItemResponse = ProjectItem & { item: Item }; // Include item details
export type ProjectWithItemsResponse = Project & { items: ProjectItemResponse[] };
