"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function Shell({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  // Remember the user's choice across reloads.
  useEffect(() => {
    setCollapsed(localStorage.getItem("robu-sidebar-collapsed") === "1");
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("robu-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div
      className="grid h-screen w-screen transition-[grid-template-columns] duration-200 ease-out"
      style={{ gridTemplateColumns: (collapsed ? "68px" : "248px") + " 1fr" }}
    >
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="overflow-hidden">{children}</main>
    </div>
  );
}
