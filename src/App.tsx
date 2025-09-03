import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OnlineData from "./pages/OnlineData";
import TableData from "./pages/TableData";
import GraphData from "./pages/GraphData";
import Config from "./pages/Config";
import Users from "./pages/Users";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";
import LineGraph from "./pages/LineGraph";
import DemandGraph from "./pages/DemandGraph";
import TOUDemand from "./pages/TOU-Demand";
import EnergyGraph from "./pages/EnergyGraph";
import CompareGraph from "./pages/CompareGraph";
import Event from "./pages/Event";
import MeterTree from "./pages/MeterTree";
import Email from "./pages/Email";
import HubDashboard from "./pages/HubDashboard";
import { Home } from "./components/dashboard/HubDashboard";
import Login from "./pages/Login";
import { MeterTreeProvider } from './context/MeterTreeContext';
import { TableColumnContext } from './components/ui/sidebar-menu';
import TOUEnergy from "./pages/TOU-Energy";
import TOUCompare from "./pages/TOU-Compare";
import Charge from "./pages/Charge";
import Holiday from "./pages/Holiday";
import AuthCallback from './pages/AuthCallback';
import LineCallback from './pages/LineCallback';


import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';

const queryClient = new QueryClient();

const App = () => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Frequency", "Volt AN", "Volt BN", "Volt CN", "Volt LN Avg", "Volt AB", "Volt BC", "Volt CA", "Volt LL Avg",
    "Current A", "Current B", "Current C", "Current Avg", "Current IN",
    "Watt A", "Watt B", "Watt C", "Watt Total",
    "Var A", "Var B", "Var C", "Var total",
    "VA A", "VA B", "VA C", "VA Total",
    "PF A", "PF B", "PF C", "PF Total",
    "Demand W", "Demand Var", "Demand VA",
    "Import kWh", "Export kWh", "Import kVarh", "Export kVarh",
    "THDV", "THDI"
  ]);

  return (
    <LanguageProvider>
      <MeterTreeProvider>
        <TableColumnContext.Provider value={{ selectedColumns, setSelectedColumns }}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/online-data" element={<OnlineData />} />
                  <Route path="/table-data" element={<TableData />} />

                  <Route path="/graph-data" element={<GraphData />} />
                  <Route path="/graph-data/line" element={<LineGraph />} />
                  <Route path="/graph-data/demand" element={<DemandGraph />} />
                  <Route path="/graph-data/energy" element={<EnergyGraph />} />
                  <Route path="/graph-data/compare" element={<CompareGraph />} />
                  <Route path="/event" element={<Event />} />
                  <Route path="/meter-tree" element={<MeterTree />} />
                  <Route path="/config" element={<Config />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/export" element={<Export />} />
                  <Route path="/email" element={<Email />} />
                  <Route path="/config/email" element={<Email />} />
                  <Route path="/dashboard" element={<HubDashboard />} />
                  <Route path="/tou-demand" element={<TOUDemand />} />
                  <Route path="/tou-energy" element={<TOUEnergy />} />
                  <Route path="/tou-compare" element={<TOUCompare />} />
                  <Route path="/charge" element={<Charge />} />
                  <Route path="/holiday" element={<Holiday />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/line-callback" element={<LineCallback />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </TableColumnContext.Provider>
      </MeterTreeProvider>
    </LanguageProvider>
  );
};

export default App;
