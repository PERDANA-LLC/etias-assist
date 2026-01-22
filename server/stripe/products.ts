import { SERVICE_FEE_CENTS, SERVICE_FEE_CURRENCY } from "../../shared/etias";

export const ETIAS_SERVICE_PRODUCT = {
  name: "ETIAS Application Assistance",
  description: "Professional assistance for preparing your ETIAS travel authorization application",
  price: SERVICE_FEE_CENTS,
  currency: SERVICE_FEE_CURRENCY,
  metadata: {
    product_type: "etias_assistance",
    includes: "eligibility_check,form_validation,ai_support,redirect_service"
  }
};

export const getProductLineItems = (applicationId: number) => [
  {
    price_data: {
      currency: ETIAS_SERVICE_PRODUCT.currency,
      product_data: {
        name: ETIAS_SERVICE_PRODUCT.name,
        description: ETIAS_SERVICE_PRODUCT.description,
        metadata: ETIAS_SERVICE_PRODUCT.metadata
      },
      unit_amount: ETIAS_SERVICE_PRODUCT.price,
    },
    quantity: 1,
  }
];
