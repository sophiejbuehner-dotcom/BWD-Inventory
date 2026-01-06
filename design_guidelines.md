# Aesthetix Inventory Management System - Design Guidelines

## Design Approach

**Reference-Based**: Drawing from Linear's precision, Notion's approachable minimalism, and Arc Browser's spatial design sophistication. The interior design aesthetic translates to architectural clarity - clean lines, purposeful negative space, and materials (visual treatments) that feel premium yet functional.

## Typography

**Display/Headers**: Inter or Manrope at 700-900 weight
- H1: 48-72px (dashboard headers, page titles)
- H2: 32-40px (section headers, data tables headers)
- H3: 24-28px (card titles, modal headers)

**Body/UI**: Inter at 400-600 weight
- Body: 16px (forms, descriptions)
- UI Elements: 14px (buttons, labels, table data)
- Small/Meta: 12-13px (timestamps, helper text)

Letter-spacing: Tight (-0.02em to -0.01em) for headers, normal for body

## Layout System

**Spacing Scale**: Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: gap-8 to gap-12
- Page margins: px-8 to px-16, py-6 to py-12

**Grid System**: 
- Dashboard: 12-column grid with 24px gutters
- Sidebar: Fixed 280px (collapsed: 72px icon-only)
- Main content: max-w-7xl with dynamic columns based on data density

## Component Library

### Navigation
**Top Bar**: Full-width, h-16, contains logo, global search, notifications, user profile
**Sidebar**: Persistent left navigation with icon+label, active state uses subtle background, grouped sections with dividers

### Data Display
**Tables**: Zebra striping (subtle), sticky headers, row hover states, sortable columns with arrow indicators, pagination at bottom
**Cards**: Elevated (shadow-sm), rounded corners (8-12px), 4-column grid on desktop → 2-col tablet → 1-col mobile
**Stats Dashboard**: 3-4 metric cards in top row showing KPIs (inventory levels, low stock alerts, recent activity)

### Forms & Inputs
**Text Fields**: Clean border (2px), focus state with border highlight, floating labels, h-12 minimum
**Buttons**: Primary (solid), Secondary (outlined), Ghost (text-only), heights: 40-48px, rounded-lg
**Dropdowns/Selects**: Custom styled with chevron icon, max-height with scroll for long lists

### Modals & Overlays
**Dialogs**: Centered, max-w-2xl, backdrop blur, rounded-xl corners, slide-fade animation entry
**Side Panels**: Right-side drawer for quick actions/details, w-96 to w-[32rem]

### Inventory-Specific Components
**Stock Level Indicators**: Progress bars or circular gauges, color-coded (without mentioning specific colors)
**Product Cards**: Image thumbnail (1:1 ratio), product name, SKU, stock count, quick action buttons
**Timeline/Activity Feed**: Vertical timeline with icons for actions (added, removed, updated inventory)

## Images

**Hero Section**: Yes - Full-width hero (h-[60vh])
- Image: Modern minimalist warehouse interior or clean shelving system with organized inventory, shot with architectural photography style (wide angle, high contrast, professional lighting)
- Overlay: Gradient overlay for text legibility
- Content: Large headline (e.g., "Inventory Management, Refined"), subheading, primary CTA with blurred backdrop

**Dashboard Imagery**:
- Empty states: Subtle illustrations (line art style) for "No items" or "Getting started" prompts
- Product placeholders: 200x200px squares for items without images
- Background texture: Optional subtle geometric pattern in data-heavy sections

**Marketing/About Section** (if included):
- Team/office photos: Interior shots emphasizing clean, organized spaces
- Product showcase: Flat-lay photography of inventory items arranged artistically

**Button Treatment on Images**: All CTAs on hero/images use backdrop-blur-md with semi-transparent background, ensuring readability without disrupting visual flow.

## Page Structure

**Login/Authentication**: Centered card (max-w-md), hero image as page background with overlay
**Dashboard Home**: Stats row → Recent activity table → Quick actions grid
**Inventory List**: Filters sidebar (collapsible) + main table/grid view toggle
**Product Detail**: Split layout - left (image + specs), right (stock info + actions)
**Reports/Analytics**: Full-width charts and graphs with card containers