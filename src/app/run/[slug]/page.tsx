import RunOnlyClient from "../RunOnlyClient";

export default async function RunSlugPage({ params }: any) {
  const resolvedParams = await params;
  return <RunOnlyClient slug={resolvedParams?.slug} />;
}
