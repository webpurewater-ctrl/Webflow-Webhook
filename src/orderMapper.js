function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function toNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function normalizeItems(rawItems = []) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => ({
    sku: pickString(item.sku, item.variantSku, item.id),
    name: pickString(item.name, item.productName, item.title),
    quantity: toNumber(item.quantity, 1),
    unitPrice: toNumber(item.price?.value, toNumber(item.price, 0)),
    totalPrice: toNumber(item.rowTotal, toNumber(item.total, 0))
  }));
}

function extractOrder(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return (
    payload.order ||
    payload.data?.order ||
    payload.payload?.order ||
    payload.data ||
    payload
  );
}

function mapWebflowOrderToClickShipSettlement(webflowPayload) {
  const order = extractOrder(webflowPayload);
  if (!order || typeof order !== "object") {
    throw new Error("Unable to locate an order object in webhook payload");
  }

  const shippingAddress = order.shippingAddress || order.shippingAddressData || {};
  const billingAddress = order.billingAddress || order.billingAddressData || {};
  const customer = order.customerInfo || order.customer || {};

  return {
    externalOrderId: pickString(order.orderId, order.id, order.orderNumber),
    orderNumber: pickString(order.orderNumber, order.orderId, order.id),
    currency: pickString(order.currency, order.currencyCode, "USD"),
    orderDate: pickString(order.acceptedOn, order.createdOn, order.createdAt),
    totals: {
      subtotal: toNumber(order.subtotal?.value, toNumber(order.subtotal, 0)),
      shipping: toNumber(order.shippingTotal?.value, toNumber(order.shipping, 0)),
      tax: toNumber(order.taxTotal?.value, toNumber(order.tax, 0)),
      discount: toNumber(order.discountTotal?.value, toNumber(order.discount, 0)),
      grandTotal: toNumber(order.grandTotal?.value, toNumber(order.total, 0))
    },
    customer: {
      firstName: pickString(customer.firstName, order.customerFirstName),
      lastName: pickString(customer.lastName, order.customerLastName),
      email: pickString(customer.email, order.customerEmail),
      phone: pickString(customer.phone, order.customerPhone)
    },
    shippingAddress: {
      name: pickString(shippingAddress.name, shippingAddress.addressee),
      line1: pickString(shippingAddress.address1, shippingAddress.line1),
      line2: pickString(shippingAddress.address2, shippingAddress.line2),
      city: pickString(shippingAddress.city),
      state: pickString(shippingAddress.state, shippingAddress.region),
      postalCode: pickString(shippingAddress.postalCode, shippingAddress.zip),
      country: pickString(shippingAddress.country)
    },
    billingAddress: {
      name: pickString(billingAddress.name, billingAddress.addressee),
      line1: pickString(billingAddress.address1, billingAddress.line1),
      line2: pickString(billingAddress.address2, billingAddress.line2),
      city: pickString(billingAddress.city),
      state: pickString(billingAddress.state, billingAddress.region),
      postalCode: pickString(billingAddress.postalCode, billingAddress.zip),
      country: pickString(billingAddress.country)
    },
    items: normalizeItems(order.items || order.purchasedItems || [])
  };
}

module.exports = {
  mapWebflowOrderToClickShipSettlement
};
