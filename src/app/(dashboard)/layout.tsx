// src/app/(dashboard)/layout.tsx
import { Sidebar } from "../../components/layout/sidebar";
import { Header } from "../../components/layout/header";
import { Toaster } from "@/components/ui/sonner"; // Ensure this path is correct

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F0EBE0] text-[#2D3436]">
      {/* Note: I replaced 'bg-cream' with the hex code #FFFDF5 directly 
         [cite_start]to match your "Project Identity" PDF [cite: 27] just in case 
         your tailwind config isn't set up yet. 
      */}

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 relative">
          {children}
        </main>
      </div>

      {/* This component renders the actual toast popups */}
      <Toaster />
    </div>
  );
}