import { listContacts } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { PeopleTable } from "@/components/PeopleTable";

export const dynamic = "force-dynamic";

export default function PeoplePage() {
  const people = listContacts();
  return (
    <>
      <PageTitle first="PEOPLE" accent="DIRECTORY" sub="Every contact across every client, with how to reach them and when you last did." />
      <PeopleTable people={people} />
    </>
  );
}
