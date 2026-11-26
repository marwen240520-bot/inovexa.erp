// app/subscription/page.tsx — page Abonnement hors de l'ERP.
// C'est ici qu'arrive un compte dont l'accès est fermé (essai terminé, abonnement échu, suspension) : il choisit sa
// formule, règle par le moyen de son choix et déclare son paiement. Ses données sont conservées.
import SubscriptionScreen from "@/components/account/SubscriptionScreen";

export default function SubscriptionPage() {
  return <SubscriptionScreen standalone />;
}
