import RunOnlyClient from "../RunOnlyClient";
import config from "@/src/config";

type RunSlugPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export function generateStaticParams() {
  return Object.keys(config.ROMS).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function RunSlugPage({ params }: RunSlugPageProps) {
  const resolvedParams = await Promise.resolve(params);
  return <RunOnlyClient slug={resolvedParams?.slug} />;
}
