const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="gs-paybanner gs-paybanner--error">
        Real payments are not configured yet. Finish payments go-live to accept cards.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="gs-paybanner">
        Payments in the preview are in test mode — no card is ever charged.
      </div>
    );
  }
  return null;
}
