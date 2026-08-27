import { useCallback, useState } from "react";

import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

/** Returns the rendered element, not a component factory — a new component
 *  reference each render remounts the provider and breaks the client secret. */
export function useStripeCheckout() {
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => setOptions(opts), []);
  const closeCheckout = useCallback(() => setOptions(null), []);

  const checkoutElement = options ? <StripeEmbeddedCheckout {...options} /> : null;

  return { openCheckout, closeCheckout, isOpen: options !== null, checkoutElement };
}
