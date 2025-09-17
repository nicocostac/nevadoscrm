import { notFound } from "next/navigation";

import { LeadDetailView } from "@/components/leads/lead-detail-view";

type LeadDetailPageProps = {
  params: { id: string };
};

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return <LeadDetailView leadId={id} />;
}
