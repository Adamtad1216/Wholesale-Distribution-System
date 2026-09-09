import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "System Administrator";

export const ALL_PERMISSIONS = [
  // Wildcard Permission — Unrestricted System Access
  {
    name: "*",
    module: "system",
    action: "all",
    description: "Wildcard super admin access to all modules",
  },

  // Customers
  {
    name: "customers:create",
    module: "customers",
    action: "create",
    description: "Create customers",
  },
  {
    name: "customers:read",
    module: "customers",
    action: "read",
    description: "Read customers",
  },
  {
    name: "customers:update",
    module: "customers",
    action: "update",
    description: "Update customers",
  },
  {
    name: "customers:delete",
    module: "customers",
    action: "delete",
    description: "Delete customers",
  },

  // Organizational Structure
  {
    name: "companies:create",
    module: "companies",
    action: "create",
    description: "Create companies",
  },
  {
    name: "companies:read",
    module: "companies",
    action: "read",
    description: "Read companies",
  },
  {
    name: "companies:update",
    module: "companies",
    action: "update",
    description: "Update companies",
  },
  {
    name: "companies:delete",
    module: "companies",
    action: "delete",
    description: "Delete companies",
  },

  {
    name: "branches:create",
    module: "branches",
    action: "create",
    description: "Create branches",
  },
  {
    name: "branches:read",
    module: "branches",
    action: "read",
    description: "Read branches",
  },
  {
    name: "branches:update",
    module: "branches",
    action: "update",
    description: "Update branches",
  },
  {
    name: "branches:delete",
    module: "branches",
    action: "delete",
    description: "Delete branches",
  },

  {
    name: "regions:create",
    module: "regions",
    action: "create",
    description: "Create regions",
  },
  {
    name: "regions:read",
    module: "regions",
    action: "read",
    description: "Read regions",
  },
  {
    name: "regions:update",
    module: "regions",
    action: "update",
    description: "Update regions",
  },
  {
    name: "regions:delete",
    module: "regions",
    action: "delete",
    description: "Delete regions",
  },

  {
    name: "warehouses:create",
    module: "warehouses",
    action: "create",
    description: "Create warehouses",
  },
  {
    name: "warehouses:read",
    module: "warehouses",
    action: "read",
    description: "Read warehouses",
  },
  {
    name: "warehouses:update",
    module: "warehouses",
    action: "update",
    description: "Update warehouses",
  },
  {
    name: "warehouses:delete",
    module: "warehouses",
    action: "delete",
    description: "Delete warehouses",
  },
  {
    name: "warehouses:manage_all",
    module: "warehouses",
    action: "manage_all",
    description: "Manage all warehouses without regional or manager scoping",
  },

  // Product Catalog
  {
    name: "products:create",
    module: "products",
    action: "create",
    description: "Create products",
  },
  {
    name: "products:read",
    module: "products",
    action: "read",
    description: "Read products",
  },
  {
    name: "products:update",
    module: "products",
    action: "update",
    description: "Update products",
  },
  {
    name: "products:delete",
    module: "products",
    action: "delete",
    description: "Delete products",
  },

  {
    name: "categories:create",
    module: "categories",
    action: "create",
    description: "Create product categories",
  },
  {
    name: "categories:read",
    module: "categories",
    action: "read",
    description: "Read product categories",
  },
  {
    name: "categories:update",
    module: "categories",
    action: "update",
    description: "Update product categories",
  },
  {
    name: "categories:delete",
    module: "categories",
    action: "delete",
    description: "Delete product categories",
  },

  {
    name: "brands:create",
    module: "brands",
    action: "create",
    description: "Create brands",
  },
  {
    name: "brands:read",
    module: "brands",
    action: "read",
    description: "Read brands",
  },
  {
    name: "brands:update",
    module: "brands",
    action: "update",
    description: "Update brands",
  },
  {
    name: "brands:delete",
    module: "brands",
    action: "delete",
    description: "Delete brands",
  },

  {
    name: "units:create",
    module: "units",
    action: "create",
    description: "Create units of measure",
  },
  {
    name: "units:read",
    module: "units",
    action: "read",
    description: "Read units of measure",
  },
  {
    name: "units:update",
    module: "units",
    action: "update",
    description: "Update units of measure",
  },
  {
    name: "units:delete",
    module: "units",
    action: "delete",
    description: "Delete units of measure",
  },

  {
    name: "warehouse-selling-prices:create",
    module: "products",
    action: "create",
    description: "Create warehouse selling prices",
  },
  {
    name: "warehouse-selling-prices:read",
    module: "products",
    action: "read",
    description: "Read warehouse selling prices",
  },
  {
    name: "warehouse-selling-prices:update",
    module: "products",
    action: "update",
    description: "Update warehouse selling prices",
  },
  {
    name: "warehouse-selling-prices:delete",
    module: "products",
    action: "delete",
    description: "Delete warehouse selling prices",
  },

  // Inventory Management
  {
    name: "inventory:stock:create",
    module: "inventory",
    action: "create",
    description: "Create inventory stock records",
  },
  {
    name: "inventory:stock:read",
    module: "inventory",
    action: "read",
    description: "Read warehouse inventory stock",
  },
  {
    name: "inventory:stock:update",
    module: "inventory",
    action: "update",
    description: "Update warehouse stock levels",
  },
  {
    name: "inventory:stock:delete",
    module: "inventory",
    action: "delete",
    description: "Delete warehouse stock records",
  },
  {
    name: "inventory:adjustments:create",
    module: "inventory",
    action: "create",
    description: "Create inventory stock adjustments",
  },
  {
    name: "inventory:adjustments:read",
    module: "inventory",
    action: "read",
    description: "Read inventory stock adjustments",
  },
  {
    name: "inventory:adjustments:update",
    module: "inventory",
    action: "update",
    description: "Update inventory stock adjustments",
  },
  {
    name: "inventory:adjustments:delete",
    module: "inventory",
    action: "delete",
    description: "Delete inventory stock adjustments",
  },
  {
    name: "inventory:adjustments:approve",
    module: "inventory",
    action: "approve",
    description: "Approve inventory stock adjustments",
  },
  {
    name: "inventory:reservations:create",
    module: "inventory",
    action: "create",
    description: "Create stock reservations",
  },
  {
    name: "inventory:reservations:read",
    module: "inventory",
    action: "read",
    description: "Read stock reservations",
  },
  {
    name: "inventory:reservations:release",
    module: "inventory",
    action: "release",
    description: "Release reserved stock back to inventory",
  },
  {
    name: "inventory:reservations:delete",
    module: "inventory",
    action: "delete",
    description: "Delete or cancel stock reservations",
  },
  {
    name: "inventory:transfers:create",
    module: "inventory",
    action: "create",
    description: "Create inter-warehouse transfers",
  },
  {
    name: "inventory:transfers:read",
    module: "inventory",
    action: "read",
    description: "Read inter-warehouse transfers",
  },
  {
    name: "inventory:transfers:update",
    module: "inventory",
    action: "update",
    description: "Update inter-warehouse transfers",
  },
  {
    name: "inventory:transfers:delete",
    module: "inventory",
    action: "delete",
    description: "Delete inter-warehouse transfers",
  },

  // Sales Orders & Fulfillment
  {
    name: "sales_orders:create",
    module: "sales_orders",
    action: "create",
    description: "Create sales orders",
  },
  {
    name: "sales_orders:read",
    module: "sales_orders",
    action: "read",
    description: "Read sales orders (scoped)",
  },
  {
    name: "sales_orders:read_all",
    module: "sales_orders",
    action: "read_all",
    description: "Read all sales orders across all customers",
  },
  {
    name: "sales_orders:update",
    module: "sales_orders",
    action: "update",
    description: "Update sales orders",
  },
  {
    name: "sales_orders:delete",
    module: "sales_orders",
    action: "delete",
    description: "Delete sales orders",
  },
  {
    name: "sales_orders:approve",
    module: "sales_orders",
    action: "approve",
    description: "Approve, reject, or request adjustments on sales orders",
  },
  {
    name: "orders:create",
    module: "sales_orders",
    action: "create",
    description: "Create sales orders (alias)",
  },
  {
    name: "orders:read",
    module: "sales_orders",
    action: "read",
    description: "Read sales orders (alias)",
  },
  {
    name: "orders:update",
    module: "sales_orders",
    action: "update",
    description: "Update sales orders (alias)",
  },
  {
    name: "orders:delete",
    module: "sales_orders",
    action: "delete",
    description: "Delete sales orders (alias)",
  },
  {
    name: "orders:approve",
    module: "sales_orders",
    action: "approve",
    description: "Approve sales orders (alias)",
  },

  // Warehouse Preparation Tasks
  {
    name: "preparation_tasks:create",
    module: "preparation_tasks",
    action: "create",
    description: "Schedule and create preparation tasks",
  },
  {
    name: "preparation_tasks:read",
    module: "preparation_tasks",
    action: "read",
    description: "Read preparation tasks",
  },
  {
    name: "preparation_tasks:update",
    module: "preparation_tasks",
    action: "update",
    description: "Update and complete preparation tasks",
  },
  {
    name: "preparation_tasks:manage_all",
    module: "preparation_tasks",
    action: "manage_all",
    description: "Manage all warehouse preparation tasks across all warehouses",
  },

  // Deliveries
  {
    name: "deliveries:create",
    module: "deliveries",
    action: "create",
    description: "Schedule and create deliveries",
  },
  {
    name: "deliveries:read",
    module: "deliveries",
    action: "read",
    description: "Read deliveries",
  },
  {
    name: "deliveries:update",
    module: "deliveries",
    action: "update",
    description: "Start and complete deliveries",
  },
  {
    name: "deliveries:manage_all",
    module: "deliveries",
    action: "manage_all",
    description: "Manage and supervise all fleet deliveries",
  },
  {
    name: "deliveries:confirm_any",
    module: "deliveries",
    action: "confirm_any",
    description: "Confirm delivery handover on behalf of customer or driver",
  },

  // Fleet & Vehicle Logistics
  {
    name: "vehicles:read",
    module: "vehicles",
    action: "read",
    description: "View fleet vehicles and driver assignments",
  },
  {
    name: "vehicles:create",
    module: "vehicles",
    action: "create",
    description: "Register new fleet vehicles",
  },
  {
    name: "vehicles:update",
    module: "vehicles",
    action: "update",
    description: "Update vehicle details and status",
  },
  {
    name: "vehicles:delete",
    module: "vehicles",
    action: "delete",
    description: "Archive or delete fleet vehicles",
  },
  {
    name: "vehicles:assign",
    module: "vehicles",
    action: "assign",
    description: "Assign or unassign vehicles to qualified drivers",
  },

  // Invoices & Finance
  {
    name: "invoices:create",
    module: "invoices",
    action: "create",
    description: "Create commercial invoices",
  },
  {
    name: "invoices:read",
    module: "invoices",
    action: "read",
    description: "Read invoices (scoped)",
  },
  {
    name: "invoices:read_all",
    module: "invoices",
    action: "read_all",
    description: "Read all commercial invoices across all customers",
  },
  {
    name: "invoices:update",
    module: "invoices",
    action: "update",
    description: "Update commercial invoices",
  },
  {
    name: "invoices:delete",
    module: "invoices",
    action: "delete",
    description: "Cancel or void invoices",
  },
  {
    name: "payments:create",
    module: "payments",
    action: "create",
    description: "Record invoice payments",
  },
  {
    name: "payments:read",
    module: "payments",
    action: "read",
    description: "Read payment records",
  },
  {
    name: "payments:update",
    module: "payments",
    action: "update",
    description: "Update payment records",
  },
  {
    name: "payments:delete",
    module: "payments",
    action: "delete",
    description: "Void payment records",
  },
  {
    name: "payment_terms:create",
    module: "finance",
    action: "create",
    description: "Create payment terms",
  },
  {
    name: "payment_terms:read",
    module: "finance",
    action: "read",
    description: "Read payment terms",
  },
  {
    name: "payment_terms:update",
    module: "finance",
    action: "update",
    description: "Update payment terms",
  },
  {
    name: "payment_terms:delete",
    module: "finance",
    action: "delete",
    description: "Delete payment terms",
  },
  {
    name: "credits:create",
    module: "finance",
    action: "create",
    description: "Manage customer credit limits",
  },
  {
    name: "credits:read",
    module: "finance",
    action: "read",
    description: "View customer credit profiles",
  },
  {
    name: "credits:update",
    module: "finance",
    action: "update",
    description: "Update customer credit profiles",
  },
  {
    name: "credits:delete",
    module: "finance",
    action: "delete",
    description: "Delete customer credit profiles",
  },

  // Pricing, Tiers, Discounts & Quotas
  {
    name: "PRICE_TIER_VIEW",
    module: "pricing",
    action: "view_tiers",
    description: "View price tiers",
  },
  {
    name: "PRICE_TIER_CREATE",
    module: "pricing",
    action: "create_tiers",
    description: "Create price tiers",
  },
  {
    name: "PRICE_TIER_UPDATE",
    module: "pricing",
    action: "update_tiers",
    description: "Update price tiers",
  },
  {
    name: "PRICE_TIER_DELETE",
    module: "pricing",
    action: "delete_tiers",
    description: "Delete price tiers",
  },

  {
    name: "PRODUCT_PRICE_VIEW",
    module: "pricing",
    action: "view_prices",
    description: "View product prices",
  },
  {
    name: "PRODUCT_PRICE_CREATE",
    module: "pricing",
    action: "create_prices",
    description: "Create product prices",
  },
  {
    name: "PRODUCT_PRICE_UPDATE",
    module: "pricing",
    action: "update_prices",
    description: "Update product prices",
  },
  {
    name: "PRODUCT_PRICE_DELETE",
    module: "pricing",
    action: "delete_prices",
    description: "Delete product prices",
  },

  {
    name: "DISCOUNT_VIEW",
    module: "pricing",
    action: "view_discounts",
    description: "View discount rules",
  },
  {
    name: "DISCOUNT_CREATE",
    module: "pricing",
    action: "create_discounts",
    description: "Create discount rules",
  },
  {
    name: "DISCOUNT_UPDATE",
    module: "pricing",
    action: "update_discounts",
    description: "Update discount rules",
  },
  {
    name: "DISCOUNT_DELETE",
    module: "pricing",
    action: "delete_discounts",
    description: "Delete discount rules",
  },

  {
    name: "QUOTA_VIEW",
    module: "pricing",
    action: "view_quotas",
    description: "View sales quotas",
  },
  {
    name: "QUOTA_CREATE",
    module: "pricing",
    action: "create_quotas",
    description: "Create sales quotas",
  },
  {
    name: "QUOTA_UPDATE",
    module: "pricing",
    action: "update_quotas",
    description: "Update sales quotas",
  },
  {
    name: "QUOTA_DELETE",
    module: "pricing",
    action: "delete_quotas",
    description: "Delete sales quotas",
  },
  {
    name: "sales_quotas:read_all",
    module: "pricing",
    action: "read_all_quotas",
    description: "View quota consumption for any customer",
  },

  // Identity & Access
  {
    name: "jobSpecifications:create",
    module: "jobSpecifications",
    action: "create",
    description: "Create job specifications",
  },
  {
    name: "jobSpecifications:read",
    module: "jobSpecifications",
    action: "read",
    description: "Read job specifications",
  },
  {
    name: "jobSpecifications:update",
    module: "jobSpecifications",
    action: "update",
    description: "Update job specifications",
  },
  {
    name: "jobSpecifications:delete",
    module: "jobSpecifications",
    action: "delete",
    description: "Delete job specifications",
  },

  {
    name: "employees:create",
    module: "employees",
    action: "create",
    description: "Create employees",
  },
  {
    name: "employees:read",
    module: "employees",
    action: "read",
    description: "Read employees",
  },
  {
    name: "employees:update",
    module: "employees",
    action: "update",
    description: "Update employees",
  },
  {
    name: "employees:delete",
    module: "employees",
    action: "delete",
    description: "Delete employees",
  },

  {
    name: "users:create",
    module: "users",
    action: "create",
    description: "Create users",
  },
  {
    name: "users:read",
    module: "users",
    action: "read",
    description: "Read users",
  },
  {
    name: "users:update",
    module: "users",
    action: "update",
    description: "Update users",
  },
  {
    name: "users:delete",
    module: "users",
    action: "delete",
    description: "Delete or archive users",
  },
  {
    name: "users:resetPassword",
    module: "users",
    action: "resetPassword",
    description: "Reset user passwords",
  },

  {
    name: "permissions:read",
    module: "permissions",
    action: "read",
    description: "Read permissions",
  },
  {
    name: "permissions:write",
    module: "permissions",
    action: "write",
    description: "Create and update permissions",
  },
  {
    name: "permissions:create",
    module: "permissions",
    action: "create",
    description: "Create permissions (alias)",
  },
  {
    name: "permissions:update",
    module: "permissions",
    action: "update",
    description: "Update permissions (alias)",
  },
  {
    name: "permissions:delete",
    module: "permissions",
    action: "delete",
    description: "Delete permissions",
  },

  {
    name: "roles:read",
    module: "roles",
    action: "read",
    description: "Read roles",
  },
  {
    name: "roles:write",
    module: "roles",
    action: "write",
    description: "Create and update roles",
  },
  {
    name: "roles:create",
    module: "roles",
    action: "create",
    description: "Create roles (alias)",
  },
  {
    name: "roles:update",
    module: "roles",
    action: "update",
    description: "Update roles (alias)",
  },
  {
    name: "roles:delete",
    module: "roles",
    action: "delete",
    description: "Delete roles",
  },
  // Finance Module
  { name: "invoices:create", module: "finance", action: "create", description: "Create invoices" },
  { name: "invoices:read", module: "finance", action: "read", description: "Read invoices" },
  { name: "invoices:read_all", module: "finance", action: "read_all", description: "View all invoices across the system" },
  { name: "invoices:update", module: "finance", action: "update", description: "Update invoices" },
  { name: "invoices:delete", module: "finance", action: "delete", description: "Delete invoices" },
  { name: "payments:create", module: "finance", action: "create", description: "Create payments" },
  { name: "payments:read", module: "finance", action: "read", description: "Read payments" },
  { name: "payments:read_all", module: "finance", action: "read_all", description: "View all payments and disbursement transactions" },
  { name: "payments:update", module: "finance", action: "update", description: "Update payments" },
  { name: "payments:delete", module: "finance", action: "delete", description: "Delete payments" },
  { name: "credits:create", module: "finance", action: "create", description: "Create credits" },
  { name: "credits:read", module: "finance", action: "read", description: "Read credits" },
  { name: "credits:update", module: "finance", action: "update", description: "Update credits" },
  { name: "credits:delete", module: "finance", action: "delete", description: "Delete credits" },
  { name: "payment-terms:create", module: "finance", action: "create", description: "Create payment terms" },
  { name: "payment-terms:read", module: "finance", action: "read", description: "Read payment terms" },
  { name: "payment-terms:update", module: "finance", action: "update", description: "Update payment terms" },
  { name: "payment-terms:delete", module: "finance", action: "delete", description: "Delete payment terms" },
  { name: "payment-options:read", module: "finance", action: "read", description: "View payment options and providers" },
  { name: "payment-options:create", module: "finance", action: "create", description: "Create payment options and providers" },
  { name: "payment-options:update", module: "finance", action: "update", description: "Update payment options and providers" },
  { name: "payment-options:delete", module: "finance", action: "delete", description: "Delete payment options and providers" },
  { name: "payment-options:manage", module: "finance", action: "manage", description: "Manage payment options and providers" },
  { name: "payment-option:manage", module: "finance", action: "manage", description: "Manage payment options" },
  { name: "payment-option:read", module: "finance", action: "read", description: "Read payment options" },

  // Reporting & Dashboards
  {
    name: "REPORT_VIEW_DASHBOARD",
    module: "reporting",
    action: "view_dashboard",
    description: "View dashboard metrics",
  },
  {
    name: "REPORT_VIEW_SALES",
    module: "reporting",
    action: "view_sales",
    description: "View sales reports",
  },
  {
    name: "REPORT_VIEW_PRODUCTS",
    module: "reporting",
    action: "view_products",
    description: "View product sales reports",
  },
  {
    name: "REPORT_VIEW_CUSTOMERS",
    module: "reporting",
    action: "view_customers",
    description: "View customer reports",
  },
  {
    name: "REPORT_VIEW_SALES_REPS",
    module: "reporting",
    action: "view_sales_reps",
    description: "View sales representative reports",
  },
  {
    name: "REPORT_VIEW_WAREHOUSE",
    module: "reporting",
    action: "view_warehouse",
    description: "View warehouse reports",
  },
  {
    name: "REPORT_VIEW_DELIVERIES",
    module: "reporting",
    action: "view_deliveries",
    description: "View delivery reports",
  },
  {
    name: "reports:view_all",
    module: "reporting",
    action: "view_all",
    description: "View company-wide reports and analytics",
  },

  // Suppliers Management
  {
    name: "suppliers:create",
    module: "suppliers",
    action: "create",
    description: "Create suppliers",
  },
  {
    name: "suppliers:read",
    module: "suppliers",
    action: "read",
    description: "Read suppliers",
  },
  {
    name: "suppliers:update",
    module: "suppliers",
    action: "update",
    description: "Update suppliers",
  },
  {
    name: "suppliers:delete",
    module: "suppliers",
    action: "delete",
    description: "Delete suppliers",
  },

  // Procurement (Purchase Orders & Goods Receipts)
  {
    name: "purchase_orders:create",
    module: "procurement",
    action: "create",
    description: "Create purchase orders",
  },
  {
    name: "purchase_orders:read",
    module: "procurement",
    action: "read",
    description: "Read purchase orders",
  },
  {
    name: "purchase_orders:update",
    module: "procurement",
    action: "update",
    description: "Update purchase orders",
  },
  {
    name: "purchase_orders:delete",
    module: "procurement",
    action: "delete",
    description: "Delete purchase orders",
  },
  {
    name: "purchase_orders:approve",
    module: "procurement",
    action: "approve",
    description: "Approve purchase orders",
  },
  {
    name: "goods_receipts:create",
    module: "procurement",
    action: "create",
    description: "Create goods receipt notes",
  },
  {
    name: "goods_receipts:read",
    module: "procurement",
    action: "read",
    description: "Read goods receipt notes",
  },
  {
    name: "goods_receipts:update",
    module: "procurement",
    action: "update",
    description: "Update goods receipt notes",
  },
  {
    name: "goods_receipts:delete",
    module: "procurement",
    action: "delete",
    description: "Delete goods receipt notes",
  },

  // Documents Management
  {
    name: "documents:create",
    module: "documents",
    action: "create",
    description: "Upload and create documents",
  },
  {
    name: "documents:read",
    module: "documents",
    action: "read",
    description: "Read and download documents",
  },
  {
    name: "documents:update",
    module: "documents",
    action: "update",
    description: "Update document metadata and status",
  },
  {
    name: "documents:delete",
    module: "documents",
    action: "delete",
    description: "Delete or archive documents",
  },

  // Sales Returns
  {
    name: "sales_returns:create",
    module: "sales_returns",
    action: "create",
    description: "Initiate sales returns and credit notes",
  },
  {
    name: "sales_returns:read",
    module: "sales_returns",
    action: "read",
    description: "Read sales return requests",
  },
  {
    name: "sales_returns:update",
    module: "sales_returns",
    action: "update",
    description: "Update sales return requests",
  },
  {
    name: "sales_returns:delete",
    module: "sales_returns",
    action: "delete",
    description: "Cancel sales return requests",
  },
  {
    name: "sales_returns:approve",
    module: "sales_returns",
    action: "approve",
    description: "Approve or reject sales return claims",
  },

  // Notifications
  {
    name: "notifications:create",
    module: "notifications",
    action: "create",
    description: "Send system notifications",
  },
  {
    name: "notifications:read",
    module: "notifications",
    action: "read",
    description: "View system notifications",
  },
  {
    name: "notifications:update",
    module: "notifications",
    action: "update",
    description: "Mark notifications as read",
  },
  {
    name: "notifications:delete",
    module: "notifications",
    action: "delete",
    description: "Clear system notifications",
  },

  // Audit
  {
    name: "audit:read",
    module: "audit",
    action: "read",
    description: "View system audit logs and compliance history",
  },
];

async function ensureDefaultPriceTiers() {
  const tiers = [
    {
      name: "Retail",
      description: "Standard retail pricing",
      isDefault: true,
      priority: 0,
    },
    {
      name: "Wholesale",
      description: "Wholesale tier pricing",
      isDefault: false,
      priority: 10,
    },
    {
      name: "Bulk",
      description: "Bulk purchase tier pricing",
      isDefault: false,
      priority: 20,
    },
  ];

  for (const tier of tiers) {
    await prisma.priceTier.upsert({
      where: { name: tier.name },
      update: {
        description: tier.description,
        isDefault: tier.isDefault,
        priority: tier.priority,
      },
      create: tier,
    });
  }
}

async function ensureDefaultOrganizationAndBranch() {
  const region = await prisma.region.upsert({
    where: { code: "AA" },
    update: { name: "Addis Ababa" },
    create: {
      code: "AA",
      name: "Addis Ababa",
      description: "Capital Region",
      isActive: true,
    },
  });

  const company = await prisma.company.upsert({
    where: { tradeLicenseNumber: "TL-HQ-001" },
    update: {
      name: "Main Wholesale Distribution Enterprise",
      regionId: region.id,
    },
    create: {
      name: "Main Wholesale Distribution Enterprise",
      legalName: "Main Wholesale Distribution Enterprise PLC",
      tradeLicenseNumber: "TL-HQ-001",
      tinNumber: "TIN-000112233",
      vatRegistrationNumber: "VAT-998877",
      isVatRegistered: true,
      email: "contact@wholesaledistribution.com",
      phone: "+251 11 123 4567",
      city: "Addis Ababa",
      regionId: region.id,
      status: "ACTIVE",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { branchCode: "BR-HQ-01" },
    update: {
      name: "Headquarters Main Branch",
      companyId: company.id,
      regionId: region.id,
    },
    create: {
      branchCode: "BR-HQ-01",
      name: "Headquarters Main Branch",
      isHeadOffice: true,
      companyId: company.id,
      regionId: region.id,
      city: "Addis Ababa",
      phone: "+251 11 123 4567",
      email: "hq@wholesaledistribution.com",
    },
  });

  return { region, company, branch };
}

async function createOrUpdateSuperUser({
  username,
  email,
  password,
  fullName,
  roleId,
}) {
  const passwordHash = await bcrypt.hash(password, 12);

  const nameParts = (fullName || username || "").trim().split(/\s+/);
  const firstName = nameParts[0] || username;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { person: { email } }],
    },
    include: { person: true },
  });

  if (existingUser) {
    console.log(
      `Updating existing admin user: ${existingUser.username} (${existingUser.id})`
    );
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username,
        passwordHash,
        isActive: true,
        accountStatus: "ACTIVE",
      },
    });

    const userRoleExists = await prisma.userRole.findFirst({
      where: { userId: existingUser.id, roleId },
    });

    if (!userRoleExists) {
      await prisma.userRole.create({
        data: { userId: existingUser.id, roleId },
      });
      console.log(`Assigned role to existing user: ${existingUser.username}`);
    }
    return existingUser;
  }

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      email,
      status: "ACTIVE",
    },
  });

  const user = await prisma.user.create({
    data: {
      personId: person.id,
      username,
      passwordHash,
      isActive: true,
      accountStatus: "ACTIVE",
      invitationAcceptedAt: new Date(),
    },
  });

  await prisma.userRole.create({
    data: { userId: user.id, roleId },
  });

  console.log(`Created super admin user: ${username} (${user.id})`);
  return user;
}

async function ensureSchemaUpToDate(client) {
  try {
    await client.$executeRawUnsafe(`
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_notes" TEXT;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_confirmed_by" UUID;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_recipient_name" TEXT;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_notes" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_latitude" DECIMAL(10, 7);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_longitude" DECIMAL(10, 7);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_address_text" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "fulfillment_type" "FulfillmentType" DEFAULT 'DELIVERY';
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_person_name" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_phone" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_vehicle_plate" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_notes" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "picked_up_at" TIMESTAMP(3);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "picked_up_by" UUID;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_confirmed_by" UUID;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_recipient_name" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_notes" TEXT;
    `);
  } catch (err) {
    console.warn("Schema self-heal note:", err?.message);
  }
}

async function main() {
  console.log("==========================================================");
  console.log("Starting Core System Seed (Permissions & Super Admin)...");
  console.log("==========================================================");

  await ensureSchemaUpToDate(prisma);
  await ensureDefaultPriceTiers();
  await ensureDefaultOrganizationAndBranch();


  // 1. Upsert all system permissions
  console.log(`Upserting ${ALL_PERMISSIONS.length} system permissions...`);
  const upsertedPermissions = [];
  for (const perm of ALL_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        description: perm.description,
        module: perm.module,
        action: perm.action,
      },
      create: perm,
    });
    upsertedPermissions.push(p);
  }
  console.log(`✓ ${upsertedPermissions.length} permissions ready.`);

  // 2. Upsert SUPER_ADMIN and ADMIN roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { description: "Super System Administrator" },
    create: {
      name: "SUPER_ADMIN",
      description: "Super System Administrator",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { description: "System Administrator" },
    create: {
      name: "ADMIN",
      description: "System Administrator",
    },
  });

  // 3. Assign Wildcard & All Permissions to SUPER_ADMIN
  const wildcardPerm = upsertedPermissions.find((p) => p.name === "*");
  const allDbPerms = await prisma.permission.findMany();

  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdminRole.id },
  });

  if (wildcardPerm) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: wildcardPerm.id,
      },
    });
  }

  // Also assign all permissions to ADMIN role
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });
  for (const perm of allDbPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log("✓ SUPER_ADMIN and ADMIN roles populated with all permissions.");

  // 4. Create / Update Super Admin User
  await createOrUpdateSuperUser({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: ADMIN_FULL_NAME,
    roleId: superAdminRole.id,
  });

  console.log("==========================================================");
  console.log("✓ Core System Seed Complete: All Permissions & Super Admin Ready.");
  console.log("  To seed workflow business data, run: npm run prisma:seed:sales");
  console.log("==========================================================\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
