import config from "@/lib/config";
import RunPage from "@/components/RunPage";

export async function generateStaticParams() {
  return Object.entries(config.ROMS).map(([key, value]: any, idx) => ({
    slug: key,
  }));
}

const DetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <>
      <RunPage slug={slug}></RunPage>
    </>
  );
};

export default DetailPage;
