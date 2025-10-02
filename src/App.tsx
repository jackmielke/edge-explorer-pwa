import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "./components/AuthWrapper";
import { GameFlow } from "./components/GameFlow";
import { EdgeExplorer } from "./pages/EdgeExplorer";
import { Profile } from "./pages/Profile";
import { AssetGenerator } from "./pages/AssetGenerator";
import NotFound from "./pages/NotFound";
import { FixedBackground } from "./components/FixedBackground";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FixedBackground />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <AuthWrapper>
                {(user) => <GameFlow user={user} />}
              </AuthWrapper>
            } 
          />
          <Route 
            path="/community/:communityId" 
            element={
              <AuthWrapper>
                {(user) => {
                  const communityId = window.location.pathname.split('/')[2];
                  return <GameFlow user={user} communityId={communityId} />;
                }}
              </AuthWrapper>
            } 
          />
          <Route 
            path="/explorer" 
            element={
              <AuthWrapper>
                {(user) => <EdgeExplorer />}
              </AuthWrapper>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <AuthWrapper>
                {(user) => <Profile user={user} />}
              </AuthWrapper>
            } 
          />
          <Route 
            path="/asset-generator" 
            element={
              <AuthWrapper>
                {(user) => <AssetGenerator />}
              </AuthWrapper>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
