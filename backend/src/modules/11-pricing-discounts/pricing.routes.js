import { Router } from "express";
import priceTiersRoutes from "./price-tiers/priceTiers.routes.js";
import productPricesRoutes from "./product-prices/productPrices.routes.js";
import discountRulesRoutes from "./discount-rules/discountRules.routes.js";
import salesQuotasRoutes from "./sales-quotas/salesQuotas.routes.js";

const router = Router();

router.use("/tiers", priceTiersRoutes);
router.use("/product-prices", productPricesRoutes);
router.use("/discounts", discountRulesRoutes);
router.use("/quotas", salesQuotasRoutes);

export default router;