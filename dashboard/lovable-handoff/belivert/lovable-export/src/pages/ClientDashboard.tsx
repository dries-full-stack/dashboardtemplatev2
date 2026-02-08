import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import belivertLogo from "@/assets/belivert-logo.png";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Trophy,
  TrendingDown,
  Zap,
  Star,
  Award,
  ThumbsDown,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Demo data for a coaching business
const DEMO_DATA = {
  clientName: "Belivert",
  period: "Q4 2026",
  
  // Core metrics
  totalLeads: 847,
  totalAppointments: 312,
  confirmedAppointments: 267,
  cancelledAppointments: 31,
  rescheduledAppointments: 24,
  noShowAppointments: 14,
  
  // Financial
  totalLeadCost: 12540,
  pricePerAppointment: 85,
  
  // Lost reasons
  lostReasons: [
    { reason: "Geen budget", count: 89, percentage: 28 },
    { reason: "Niet geïnteresseerd na gesprek", count: 74, percentage: 23 },
    { reason: "Concurrent gekozen", count: 52, percentage: 16 },
    { reason: "Timing niet goed", count: 48, percentage: 15 },
    { reason: "Geen reactie na follow-up", count: 35, percentage: 11 },
    { reason: "Overig", count: 22, percentage: 7 },
  ],
  
  // Ad hook performance
  adHooks: [
    { hook: "Wat bespaar je écht met een thuisbatterij?", leads: 312, appointments: 145, conversionRate: 46.5, costPerLead: 12.80, costPerCall: 27.55, totalSpend: 3994 },
    { hook: "Wat kost een thuisbatterij in 2026?", leads: 198, appointments: 72, conversionRate: 36.4, costPerLead: 15.20, costPerCall: 41.81, totalSpend: 3010 },
    { hook: "Geld verdienen met je thuisbatterij?", leads: 156, appointments: 52, conversionRate: 33.3, costPerLead: 14.50, costPerCall: 43.50, totalSpend: 2262 },
    { hook: "Welke thuisbatterij moet je kiezen?", leads: 124, appointments: 48, conversionRate: 38.7, costPerLead: 16.50, costPerCall: 42.63, totalSpend: 2046 },
  ],

  // Source breakdown (lead generators)
  sourceBreakdown: [
    { source: "Solvari", leads: 245, appointments: 98, inplanRatio: 40.0, deals: 24, dealPercentage: 24.5, costPerDeal: 142.50 },
    { source: "Bobex", leads: 189, appointments: 71, inplanRatio: 37.6, deals: 18, dealPercentage: 25.4, costPerDeal: 156.20 },
    { source: "Trustlocal", leads: 156, appointments: 58, inplanRatio: 37.2, deals: 14, dealPercentage: 24.1, costPerDeal: 168.30 },
    { source: "Facebook Ads", leads: 134, appointments: 52, inplanRatio: 38.8, deals: 13, dealPercentage: 25.0, costPerDeal: 134.80 },
    { source: "Google Ads", leads: 87, appointments: 24, inplanRatio: 27.6, deals: 5, dealPercentage: 20.8, costPerDeal: 198.40 },
    { source: "Organic", leads: 36, appointments: 9, inplanRatio: 25.0, deals: 2, dealPercentage: 22.2, costPerDeal: 0 },
  ],
};

const CHART_COLORS = [
  "hsl(173, 80%, 40%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(0, 70%, 50%)",
];

const lostReasonsChartData = DEMO_DATA.lostReasons.map((item, index) => ({
  name: item.reason,
  value: item.count,
  fill: CHART_COLORS[index % CHART_COLORS.length],
}));

// Helper function to get badge and tip for ad hooks
const getAdHookInsights = (hook: typeof DEMO_DATA.adHooks[0], allHooks: typeof DEMO_DATA.adHooks) => {
  const bestConversion = Math.max(...allHooks.map(h => h.conversionRate));
  const worstConversion = Math.min(...allHooks.map(h => h.conversionRate));
  const lowestCost = Math.min(...allHooks.map(h => h.costPerLead));
  const highestCost = Math.max(...allHooks.map(h => h.costPerLead));
  const mostLeads = Math.max(...allHooks.map(h => h.leads));
  
  const badges: { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }[] = [];
  const tips: string[] = [];
  
  if (hook.conversionRate === bestConversion) {
    badges.push({ label: "Beste Conversie", variant: "default", icon: <Trophy className="w-3 h-3" /> });
    tips.push("🏆 Top performer! Dit is je beste converterende hook.");
  }
  
  if (hook.conversionRate === worstConversion) {
    badges.push({ label: "Laagste Conversie", variant: "destructive", icon: <TrendingDown className="w-3 h-3" /> });
    tips.push("⚠️ Overweeg deze hook te optimaliseren of te pauzeren.");
  }
  
  if (hook.costPerLead === lowestCost) {
    badges.push({ label: "Goedkoopste Leads", variant: "default", icon: <Zap className="w-3 h-3" /> });
    tips.push("💰 Meest kostenefficiënte leadgeneratie!");
  }
  
  if (hook.costPerLead === highestCost) {
    badges.push({ label: "Duurste Leads", variant: "destructive", icon: <DollarSign className="w-3 h-3" /> });
    tips.push("📈 Hoge kosten per lead - onderzoek optimalisatie.");
  }
  
  if (hook.leads === mostLeads) {
    badges.push({ label: "Meeste Volume", variant: "secondary", icon: <Star className="w-3 h-3" /> });
    tips.push("📊 Hoogste leadvolume - schaalbaar kanaal.");
  }
  
  // Performance score
  const conversionScore = (hook.conversionRate / bestConversion) * 100;
  const costScore = (lowestCost / hook.costPerLead) * 100;
  const overallScore = (conversionScore + costScore) / 2;
  
  return { badges, tips, overallScore, conversionScore, costScore };
};

// Radar chart data for ad hooks
const radarData = DEMO_DATA.adHooks.map(hook => {
  const insights = getAdHookInsights(hook, DEMO_DATA.adHooks);
  return {
    hook: hook.hook.split(' ').slice(0, 2).join(' '),
    conversie: hook.conversionRate,
    volume: (hook.leads / Math.max(...DEMO_DATA.adHooks.map(h => h.leads))) * 50,
    efficiency: insights.costScore,
  };
});

export default function ClientDashboard() {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2026, 9, 1)); // Oct 1, 2026
  const [dateTo, setDateTo] = useState<Date>(new Date(2026, 11, 31)); // Dec 31, 2026

  const stats = {
    totalLeads: DEMO_DATA.totalLeads,
    totalAppointments: DEMO_DATA.totalAppointments,
    confirmedAppointments: DEMO_DATA.confirmedAppointments,
    leadsToAppointmentRatio: (DEMO_DATA.totalAppointments / DEMO_DATA.totalLeads * 100),
    totalLeadCost: DEMO_DATA.totalLeadCost,
    costPerAppointment: DEMO_DATA.totalLeadCost / DEMO_DATA.confirmedAppointments,
    totalRevenue: DEMO_DATA.confirmedAppointments * DEMO_DATA.pricePerAppointment,
    profit: (DEMO_DATA.confirmedAppointments * DEMO_DATA.pricePerAppointment) - DEMO_DATA.totalLeadCost,
    roi: (((DEMO_DATA.confirmedAppointments * DEMO_DATA.pricePerAppointment) - DEMO_DATA.totalLeadCost) / DEMO_DATA.totalLeadCost) * 100,
  };

  // Find best and worst hooks
  const sortedByConversion = [...DEMO_DATA.adHooks].sort((a, b) => b.conversionRate - a.conversionRate);
  const bestHook = sortedByConversion[0];
  const worstHook = sortedByConversion[sortedByConversion.length - 1];

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{DEMO_DATA.clientName}</h1>
          <p className="text-sm text-muted-foreground">
            Performance Dashboard · Leads, Afspraken & ROI
          </p>
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal bg-card",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: nl }) : "Van datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => date && setDateFrom(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground">→</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal bg-card",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "d MMM yyyy", { locale: nl }) : "Tot datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => date && setDateTo(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* Core Funnel Metrics */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Funnel Metrics
          </h2>
          <p className="text-sm text-gray-500 mb-4">Overzicht van leads en afspraken</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <KPICard
              title="Totaal Leads"
              value={stats.totalLeads}
              icon={Users}
              calculationRule="Alle unieke leads binnen de geselecteerde periode"
            />
            <KPICard
              title="Totaal Afspraken"
              value={stats.totalAppointments}
              icon={CalendarIcon}
              calculationRule="Alle geboekte afspraken binnen de periode"
            />
            <KPICard
              title="Cancelled"
              value={DEMO_DATA.cancelledAppointments}
              icon={XCircle}
              variant="danger"
              calculationRule="Afspraken die geannuleerd zijn"
            />
            <KPICard
              title="Rescheduled"
              value={DEMO_DATA.rescheduledAppointments}
              icon={RefreshCw}
              variant="warning"
              calculationRule="Afspraken die verzet zijn naar een andere datum"
            />
            <KPICard
              title="No-Show"
              value={DEMO_DATA.noShowAppointments}
              icon={Clock}
              variant="danger"
              calculationRule="Afspraken waar de klant niet is komen opdagen"
            />
            <KPICard
              title="Lead → Afspraak"
              value={stats.leadsToAppointmentRatio}
              format="percent"
              icon={Target}
              calculationRule="Formule: (Totaal Afspraken / Totaal Leads) × 100%"
            />
          </div>
        </section>

        {/* Source Breakdown */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Source Breakdown
          </h2>
          <p className="text-sm text-gray-500 mb-4">Prestaties per leadgenerator</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bron</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Appointments</TableHead>
                  <TableHead className="text-right">Inplan %</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">% naar Deals</TableHead>
                  <TableHead className="text-right">Cost per Deal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_DATA.sourceBreakdown.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-right">{row.leads}</TableCell>
                    <TableCell className="text-right">{row.appointments}</TableCell>
                    <TableCell className="text-right">{row.inplanRatio.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{row.deals}</TableCell>
                    <TableCell className="text-right">{row.dealPercentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {row.costPerDeal > 0 ? `€${row.costPerDeal.toFixed(2)}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Financial Metrics */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Financiële Metrics
          </h2>
          <p className="text-sm text-gray-500 mb-4">Kosten, omzet en rendement</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Totale Leadkosten"
              value={stats.totalLeadCost}
              format="currency"
              icon={DollarSign}
              calculationRule="Som van alle advertentie- en marketingkosten"
            />
            <KPICard
              title="Kost per Afspraak"
              value={stats.costPerAppointment}
              format="currency"
              icon={BarChart3}
              calculationRule="Formule: Totale Leadkosten / Confirmed Afspraken"
            />
            <KPICard
              title="Totale Omzet"
              value={stats.totalRevenue}
              format="currency"
              icon={TrendingUp}
              variant="success"
              calculationRule={`Formule: Confirmed Afspraken × €${DEMO_DATA.pricePerAppointment} per afspraak`}
            />
            <KPICard
              title="Winst / Verlies"
              value={stats.profit}
              format="currency"
              icon={stats.profit >= 0 ? CheckCircle : AlertTriangle}
              variant={stats.profit > 0 ? "success" : "danger"}
              calculationRule="Formule: Totale Omzet − Totale Leadkosten"
            />
            <KPICard
              title="ROI"
              value={stats.roi}
              format="percent"
              icon={Percent}
              variant={stats.roi > 50 ? "success" : stats.roi > 0 ? "warning" : "danger"}
              calculationRule="Formule: ((Omzet − Kosten) / Kosten) × 100%"
            />
          </div>
        </section>

        {/* Ad Hook Performance - Visual Cards */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Ad Hook Performance
          </h2>
          <p className="text-sm text-gray-500 mb-4">Vergelijk de prestaties van je advertentie hooks</p>
          
          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Beste Performer Card */}
            <Card className="border-l-4 shadow-sm border-transparent" style={{ backgroundColor: '#1B9C54' }}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white">{bestHook.hook}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold text-white">{bestHook.conversionRate}% conversie</span>
                      <span className="text-sm text-white/80">€{bestHook.costPerLead.toFixed(2)}/lead</span>
                    </div>
                    <div className="mt-3 p-2 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <p className="text-sm text-white/90">
                        💡 Tip: Schaal dit budget op voor maximale ROI
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Needs Improvement Card */}
            <Card className="border-l-4 border-l-amber-600 bg-[#FEF6DC] shadow-sm border-amber-300">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F2B92D' }}>
                    <ThumbsDown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">{worstHook.hook}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold text-gray-900">{worstHook.conversionRate}% conversie</span>
                      <span className="text-sm text-gray-700">€{worstHook.costPerLead.toFixed(2)}/lead</span>
                    </div>
                    <div className="mt-3 p-2 bg-amber-100/70 rounded-md">
                      <p className="text-sm text-gray-900">
                        💡 Tip: Test nieuwe creatives of pauzeer deze campagne
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ad Hook Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {DEMO_DATA.adHooks.map((hook, index) => {
              const insights = getAdHookInsights(hook, DEMO_DATA.adHooks);
              return (
                <Card key={hook.hook} className="relative overflow-hidden">
                  {insights.badges.some(b => b.label === "Beste Conversie") && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute transform rotate-45 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center" style={{ backgroundColor: '#1B9C54' }}>
                        #1
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-semibold">{hook.hook}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insights.badges.map((badge, i) => (
                        <Badge key={i} variant={badge.variant} className="text-xs gap-1">
                          {badge.icon}
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Leads</p>
                        <p className="text-lg font-bold">{hook.leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Afspraken</p>
                        <p className="text-lg font-bold text-amber-700">{hook.appointments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversie</p>
                        <p className={cn(
                          "text-lg font-bold",
                          hook.conversionRate > 35 ? "text-amber-700" : hook.conversionRate > 25 ? "text-amber-600" : "text-orange-500"
                        )}>
                          {hook.conversionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kost/Lead</p>
                        <p className="text-lg font-bold">€{hook.costPerLead.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kost/Call</p>
                        <p className={cn(
                          "text-lg font-bold",
                          hook.costPerCall < 40 ? "text-amber-700" : hook.costPerCall < 60 ? "text-amber-600" : "text-orange-500"
                        )}>
                          €{hook.costPerCall.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Spend</p>
                        <p className="text-lg font-bold">€{hook.totalSpend.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Lost Reasons Section */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Analyse & Inzichten
          </h2>
          <p className="text-sm text-gray-500 mb-4">Verloren leads en verdeling per reden</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Verloren Leads - Redenen
              </CardTitle>
              <CardDescription>Analyseer waarom leads niet converteren</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEMO_DATA.lostReasons.map((item, index) => (
                  <div key={item.reason} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-foreground">{item.reason}</span>
                      {index === 0 && (
                        <Badge variant="destructive" className="text-xs">Top reden</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  💡 <strong>Tip:</strong> "Geen budget" is je grootste blocker. Overweeg betalingsplannen of een goedkoper instap-aanbod.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verdeling Verloren Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lostReasonsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {lostReasonsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Leads']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </div>
        </section>

        {/* Summary Card */}
        <section className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Samenvatting & Aanbevelingen
          </h2>
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Totale ROI</p>
                <p className="text-2xl font-bold text-foreground">+{stats.roi.toFixed(1)}%</p>
                <p className="text-sm text-primary">€{stats.profit.toFixed(0)} winst</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Top Verliesreden</p>
                <p className="text-lg font-semibold text-foreground">Geen budget</p>
                <p className="text-sm text-primary">28% van verloren leads</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Aanbeveling</p>
                <p className="text-lg font-semibold text-foreground">Schaal "Wat bespaar je écht"</p>
                <p className="text-sm text-primary">+25% budget verhogen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
