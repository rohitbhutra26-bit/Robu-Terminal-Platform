import type { ReactNode } from "react";

// Gives the Automated module the same page padding + scroll container as the
// other tabs (Charts/Home/Design use px-8 py-8) so it doesn't hug the sidebar.
export default function AutomatedLayout({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto px-8 py-8">{children}</div>;
}
