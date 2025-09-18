import type { PricingMode, Product, ProductRule } from "@/lib/types";

export type RuleEvaluationContext = {
  product: Product;
  quantity: number;
  pricingMode: PricingMode;
  hasContract: boolean;
  contractTermMonths?: number | null;
  coverageZone?: string | null;
  serviceType?: string | null;
  orderTotal?: number | null;
};

export type RuleEvaluationResult = {
  unitPrice?: number | null | "solo_agua_consumida";
  extraCharge?: number | null;
  benefits: string[];
  notes: string[];
  appliedRuleIds: string[];
  ruleSnapshot?: ProductRule | null;
  total?: number | null;
};

export function evaluateProductRules(rules: ProductRule[], context: RuleEvaluationContext): RuleEvaluationResult {
  if (!rules || rules.length === 0) {
    return { benefits: [], notes: [], appliedRuleIds: [] };
  }

  const sorted = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  const appliedRuleIds: string[] = [];
  const notes: string[] = [];
  const benefits: string[] = [];
  let unitPrice: number | null | "solo_agua_consumida" = null;
  let extraCharge: number | null = null;
  let firstRuleSnapshot: ProductRule | null = null;

  for (const rule of sorted) {
    if (!rule.is_active) continue;
    if (!matchesCondition(rule, context)) continue;
    appliedRuleIds.push(rule.id);
    if (!firstRuleSnapshot) {
      firstRuleSnapshot = rule;
    }

    const effect = rule.effects ?? {};

    if (effect.unitPrice !== undefined && effect.unitPrice !== null) {
      unitPrice = effect.unitPrice;
    }

    if (effect.extraCharge !== undefined && effect.extraCharge !== null) {
      extraCharge = (extraCharge ?? 0) + Number(effect.extraCharge);
    }

    if (effect.benefits && effect.benefits.length > 0) {
      for (const benefit of effect.benefits) {
        if (!benefits.includes(benefit)) {
          benefits.push(benefit);
        }
      }
    }

    if (effect.notes) {
      notes.push(effect.notes);
    }
  }

  if (unitPrice === null && context.product.base_unit_price !== null) {
    unitPrice = context.product.base_unit_price;
  }

  let total: number | null = null;
  if (unitPrice && unitPrice !== "solo_agua_consumida") {
    total = Number(unitPrice) * context.quantity;
  }
  if (extraCharge) {
    total = (total ?? 0) + extraCharge;
  }

  return {
    unitPrice,
    extraCharge,
    benefits,
    notes,
    appliedRuleIds,
    ruleSnapshot: firstRuleSnapshot,
    total,
  };
}

function matchesCondition(rule: ProductRule, context: RuleEvaluationContext) {
  const condition = rule.conditions ?? {};

  if (condition.product && condition.product !== context.product.id) {
    return false;
  }

  if (condition.productCategory && condition.productCategory !== context.product.category) {
    return false;
  }

  if (condition.quantity) {
    const { min, max } = condition.quantity;
    if (min !== undefined && min !== null && context.quantity < min) {
      return false;
    }
    if (max !== undefined && max !== null && context.quantity > max) {
      return false;
    }
  }

  if (condition.contract === true && !context.hasContract) {
    return false;
  }

  if (
    condition.contractMonths !== undefined &&
    condition.contractMonths !== null &&
    (context.contractTermMonths ?? 0) < condition.contractMonths
  ) {
    return false;
  }

  if (condition.zone && condition.zone !== context.coverageZone) {
    return false;
  }

  if (condition.serviceType && condition.serviceType !== context.serviceType) {
    return false;
  }

  if (condition.orderTotal) {
    const { min, max } = condition.orderTotal;
    const total = context.orderTotal ?? 0;
    if (min !== undefined && min !== null && total < min) {
      return false;
    }
    if (max !== undefined && max !== null && total > max) {
      return false;
    }
  }

  return true;
}
