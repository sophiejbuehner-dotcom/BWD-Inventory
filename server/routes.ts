import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === Items ===
  app.get(api.items.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const items = await storage.getItems(search);
    res.json(items);
  });

  app.post(api.items.create.path, async (req, res) => {
    try {
      const input = api.items.create.input.parse(req.body);
      const item = await storage.createItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.items.update.path, async (req, res) => {
    try {
      const input = api.items.update.input.parse(req.body);
      const item = await storage.updateItem(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Item not found" });
    }
  });

  app.get(api.items.getProjectAssignments.path, async (req, res) => {
    const assignments = await storage.getActiveProjectItemsForItem(Number(req.params.id));
    res.json(assignments.map(a => ({
      ...a,
      addedAt: a.addedAt ? a.addedAt.toISOString() : null
    })));
  });

  // === Projects ===
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.projects.update.path, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Project not found" });
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).send();
  });

  // === Project Items ===
  app.post(api.projectItems.add.path, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const input = api.projectItems.add.input.parse({
        ...req.body,
        projectId 
      });
      // The schema validator might strip projectId if it's omitted in the schema but we need it for the DB
      // So we manually construct the full object or rely on the input being correct if we adjusted the schema correctly.
      // In shared/routes.ts we omitted projectId from input, so we need to add it back for storage.
      
      const projectItem = await storage.addProjectItem({
        ...input,
        projectId
      });
      res.status(201).json(projectItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.projectItems.update.path, async (req, res) => {
    try {
      const input = api.projectItems.update.input.parse(req.body);
      const projectItem = await storage.updateProjectItem(Number(req.params.itemId), input);
      res.json(projectItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.projectItems.delete.path, async (req, res) => {
    await storage.deleteProjectItem(Number(req.params.itemId));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingItems = await storage.getItems();
  if (existingItems.length === 0) {
    console.log("Seeding database...");
    
    // Create Items
    const itemsData = [
      { name: "Brass Table Lamp", vendor: "Arteriors", cost: "150.00", price: "285.00", bwdPrice: "210.00", category: "Lighting", description: "Modern brass table lamp with linen shade." },
      { name: "Velvet Accent Chair", vendor: "Four Hands", cost: "450.00", price: "895.00", bwdPrice: "675.00", category: "Furniture", description: "Navy blue velvet chair with gold legs." },
      { name: "Wool Area Rug 8x10", vendor: "Loloi", cost: "320.00", price: "650.00", bwdPrice: "490.00", category: "Decor", description: "Hand-tufted wool rug, neutral tones." },
      { name: "Ceramic Vase Set", vendor: "Global Views", cost: "45.00", price: "95.00", bwdPrice: "75.00", category: "Accessories", description: "Set of 3 white ceramic vases." },
      { name: "Marble Coffee Table", vendor: "Bernhardt", cost: "680.00", price: "1250.00", bwdPrice: "940.00", category: "Furniture", description: "Carrara marble top with iron base." },
    ];

    const createdItems = [];
    for (const item of itemsData) {
      createdItems.push(await storage.createItem(item));
    }

    // Create Projects
    const projectsData = [
      { name: "Smith Residence Living Room", clientName: "Alice Smith", status: "active" },
      { name: "Downtown Loft Renovation", clientName: "Mark Johnson", status: "active" },
    ];

    const createdProjects = [];
    for (const project of projectsData) {
      createdProjects.push(await storage.createProject(project));
    }

    // Add items to projects
    if (createdProjects.length > 0 && createdItems.length > 0) {
      await storage.addProjectItem({
        projectId: createdProjects[0].id,
        itemId: createdItems[0].id,
        quantity: 2,
        status: "pulled",
        notes: "Place on side tables"
      });
      
      await storage.addProjectItem({
        projectId: createdProjects[0].id,
        itemId: createdItems[1].id,
        quantity: 1,
        status: "installed",
      });

      await storage.addProjectItem({
        projectId: createdProjects[1].id,
        itemId: createdItems[2].id,
        quantity: 1,
        status: "pulled",
      });
    }
    console.log("Database seeded successfully!");
  }
}
