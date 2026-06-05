"use client";

import { useEffect, useRef, useState } from "react";

// Temporary frame wrapper for tools not yet rebuilt natively.
export default function ToolFrame({ tool }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 2500);
    return () => clearTimeout(t);
  }, [tool.url]);

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={ref}
        className="h-full w-full border-0 bg-white"
        src={tool.url}
        title={tool.name}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && slow && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-terminal px-6 text-center text-sm text-muted">
          <div className="text-base font-semibold text-primary">
            {tool.name} isn’t running yet
          </div>
          <div>
            Start it at <code className="ds-num rounded-md border border-border bg-card px-1.5 py-0.5 text-primary">{tool.url}</code>
          </div>
          <div>
            Easiest: double-click <code className="rounded-md border border-border bg-card px-1.5 py-0.5 text-primary">Start Platform.command</code>
          </div>
          {tool.note && <div className="mt-1 max-w-sm">{tool.note}</div>}
        </div>
      )}
    </div>
  );
}
