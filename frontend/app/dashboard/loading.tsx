import PageSkeleton from "@/components/ui/PageSkeleton";

// Affiché instantanément pendant le passage d'une page du tableau de bord à une autre :
// la barre latérale reste en place, seul le contenu montre son squelette.
export default function DashboardLoading() {
  return <PageSkeleton />;
}
