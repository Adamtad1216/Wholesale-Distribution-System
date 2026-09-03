import { Router } from "express";
import categoriesRoutes from "./categories/categories.routes.js";
import brandsRoutes from "./brands/brands.routes.js";
import unitsRoutes from "./units/units.routes.js";
import productsRoutes from "./products/products.routes.js";
import warehouseSellingPricesRoutes from "./warehouse-selling-prices/warehouseSellingPrices.routes.js";

const router = Router();

router.use("/categories", categoriesRoutes);
router.use("/brands", brandsRoutes);
router.use("/units", unitsRoutes);
router.use("/products", productsRoutes);
router.use("/warehouse-selling-prices", warehouseSellingPricesRoutes);

export default router;
