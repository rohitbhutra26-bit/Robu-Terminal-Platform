import { getTool, TOOLS } from "../../lib/tools";
import { notFound } from "next/navigation";
import ToolFrame from "../../components/ToolFrame";

// Only non-native tools use the generic iframe route.
// Native tools (e.g. Valuation) have their own /<slug>/page.tsx.
export function generateStaticParams() {
  return TOOLS.filter((t) => !t.native).map((t) => ({ slug: t.slug }));
}

export default function ToolPage({ params }) {
  const tool = getTool(params.slug);
  if (!tool || tool.native) notFound();
  return <ToolFrame tool={tool} />;
}
