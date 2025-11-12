import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Memory from "./pages/Memory";
import Upgrade from "./pages/Upgrade";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";

const DebugPerf = lazy(() => import("./pages/DebugPerf"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/debug/perf" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">Loading...</div>}>
                  <DebugPerf />
                </Suspense>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
