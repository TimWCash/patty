import { listCompanies } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { CompaniesTable } from "@/components/CompaniesTable";

export const dynamic = "force-dynamic";

export default function CompaniesPage() {
  const companies = listCompanies();
  return (
    <>
      <PageTitle first="" accent="COMPANIES" sub="Every client and prospect, with the latest touchpoint at a glance." />
      <CompaniesTable companies={companies} />
    </>
  );
}
