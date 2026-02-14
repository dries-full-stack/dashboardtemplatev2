import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Target,
  Timer,
  Headphones,
  PhoneOff,
  PhoneCall,
  Voicemail,
  BarChart3,
  Activity,
  Zap,
  Award,
  Medal,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

// Demo data for the call center dashboard
const DEMO_DATA = {
  // Management Summary KPIs
  leadsGebeld: 1247,
  afsprakenGemaakt: 312,
  conversieRatio: 25.0, // %
  totaalAfspraken: 312,
  uniekeAfspraken: 287,
  gemAfsprakenPerAgent: 52,
  gemCallDuration: 2.4, // minuten
  validCalls: 892,
  voicemails: 355, // < 30 sec
  productieveCalls: 892, // > 30 sec
  productieveCallsPerUur: 28.5,
  productieveTijdPercentage: 72.5,
  idleTimePercentage: 27.5,
  
  // Weekly trends
  weeklyTrend: [
    { week: "Week 1", leads: 285, afspraken: 68, calls: 1420 },
    { week: "Week 2", leads: 312, afspraken: 82, calls: 1580 },
    { week: "Week 3", leads: 298, afspraken: 74, calls: 1490 },
    { week: "Week 4", leads: 352, afspraken: 88, calls: 1720 },
  ],

  // Best calling times heatmap data
  besteTijden: [
    { uur: "09:00", connecties: 45, afspraken: 12, connectRate: 68 },
    { uur: "10:00", connecties: 62, afspraken: 18, connectRate: 82 },
    { uur: "11:00", connecties: 58, afspraken: 15, connectRate: 78 },
    { uur: "12:00", connecties: 32, afspraken: 6, connectRate: 45 },
    { uur: "13:00", connecties: 28, afspraken: 5, connectRate: 42 },
    { uur: "14:00", connecties: 54, afspraken: 14, connectRate: 72 },
    { uur: "15:00", connecties: 68, afspraken: 21, connectRate: 85 },
    { uur: "16:00", connecties: 72, afspraken: 24, connectRate: 88 },
    { uur: "17:00", connecties: 48, afspraken: 11, connectRate: 65 },
    { uur: "18:00", connecties: 25, afspraken: 4, connectRate: 38 },
  ],

  // Lead flow per sector
  leadFlowPerSector: [
    { sector: "Zonnepanelen", binnengekomen: 520, gebeld: 485, afspraken: 145, openLeads: 35 },
    { sector: "Thuisbatterij", binnengekomen: 380, gebeld: 342, afspraken: 98, openLeads: 38 },
    { sector: "Warmtepomp", binnengekomen: 245, gebeld: 228, afspraken: 52, openLeads: 17 },
    { sector: "Isolatie", binnengekomen: 102, gebeld: 92, afspraken: 17, openLeads: 10 },
  ],

  // Call quality breakdown
  callBreakdown: {
    confirmed: 198,
    lost: 89,
    abandoned: 45,
    voicemail: 355,
  },

  // Agent performance
  agents: [
    {
      naam: "Sarah van Dijk",
      calls: 245,
      afspraken: 68,
      conversie: 27.8,
      gemCallDuration: 2.8,
      productieveCallsPerUur: 32,
      nettoBeltijd: 6.2,
      idleTime: 1.8,
      eersteCall: "08:58",
      laatsteCall: "17:42",
      ranking: 1,
    },
    {
      naam: "Tim Janssen",
      calls: 232,
      afspraken: 62,
      conversie: 26.7,
      gemCallDuration: 2.5,
      productieveCallsPerUur: 30,
      nettoBeltijd: 5.8,
      idleTime: 2.1,
      eersteCall: "09:02",
      laatsteCall: "17:38",
      ranking: 2,
    },
    {
      naam: "Lisa Bakker",
      calls: 218,
      afspraken: 56,
      conversie: 25.7,
      gemCallDuration: 2.6,
      productieveCallsPerUur: 28,
      nettoBeltijd: 5.5,
      idleTime: 2.4,
      eersteCall: "09:05",
      laatsteCall: "17:35",
      ranking: 3,
    },
    {
      naam: "Mark de Groot",
      calls: 198,
      afspraken: 48,
      conversie: 24.2,
      gemCallDuration: 2.3,
      productieveCallsPerUur: 26,
      nettoBeltijd: 5.2,
      idleTime: 2.7,
      eersteCall: "09:08",
      laatsteCall: "17:28",
      ranking: 4,
    },
    {
      naam: "Emma Visser",
      calls: 185,
      afspraken: 42,
      conversie: 22.7,
      gemCallDuration: 2.2,
      productieveCallsPerUur: 24,
      nettoBeltijd: 4.8,
      idleTime: 3.1,
      eersteCall: "09:12",
      laatsteCall: "17:15",
      ranking: 5,
    },
    {
      naam: "Peter Smit",
      calls: 169,
      afspraken: 36,
      conversie: 21.3,
      gemCallDuration: 2.1,
      productieveCallsPerUur: 22,
      nettoBeltijd: 4.5,
      idleTime: 3.4,
      eersteCall: "09:15",
      laatsteCall: "17:05",
      ranking: 6,
    },
  ],

  // Funnel data
  funnelData: [
    { name: "Leads", value: 1247, fill: "hsl(173, 80%, 40%)" },
    { name: "Calls", value: 1247, fill: "hsl(200, 80%, 50%)" },
    { name: "Connect (>30s)", value: 892, fill: "hsl(38, 92%, 50%)" },
    { name: "Afspraken", value: 312, fill: "hsl(142, 76%, 36%)" },
  ],
};

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(173, 80%, 40%)",
  },
  afspraken: {
    label: "Afspraken",
    color: "hsl(142, 76%, 36%)",
  },
  calls: {
    label: "Calls",
    color: "hsl(200, 80%, 50%)",
  },
  connecties: {
    label: "Connecties",
    color: "hsl(38, 92%, 50%)",
  },
} satisfies ChartConfig;

const HEATMAP_COLORS = [
  "hsl(0, 0%, 20%)",
  "hsl(142, 30%, 30%)",
  "hsl(142, 50%, 40%)",
  "hsl(142, 70%, 50%)",
  "hsl(142, 76%, 55%)",
];

function getHeatmapColor(value: number, max: number): string {
  const normalized = value / max;
  if (normalized < 0.2) return HEATMAP_COLORS[0];
  if (normalized < 0.4) return HEATMAP_COLORS[1];
  if (normalized < 0.6) return HEATMAP_COLORS[2];
  if (normalized < 0.8) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

export default function CallCenter() {
  const [periodFilter, setPeriodFilter] = useState("week");
  const [selectedAgent1, setSelectedAgent1] = useState<string | null>(null);
  const [selectedAgent2, setSelectedAgent2] = useState<string | null>(null);

  const maxConnectRate = Math.max(...DEMO_DATA.besteTijden.map(t => t.connectRate));

  const getRankingIcon = (ranking: number) => {
    if (ranking === 1) return <Award className="w-5 h-5 text-yellow-500" />;
    if (ranking === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (ranking === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get selected agents for comparison
  const agent1 = selectedAgent1 ? DEMO_DATA.agents.find(a => a.naam === selectedAgent1) : null;
  const agent2 = selectedAgent2 ? DEMO_DATA.agents.find(a => a.naam === selectedAgent2) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Call Center Dashboard</h1>
            <p className="text-muted-foreground">
              Bekijk de performance, productiviteit en efficiëntie van het callcenter
            </p>
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecteer periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dag">Vandaag</SelectItem>
              <SelectItem value="week">Deze week</SelectItem>
              <SelectItem value="maand">Deze maand</SelectItem>
              <SelectItem value="kwartaal">Dit kwartaal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section 1: Management Summary */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Management Summary
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Leads Gebeld"
              value={DEMO_DATA.leadsGebeld}
              icon={Phone}
              calculationRule="Totaal aantal leads dat gebeld is"
            />
            <KPICard
              title="Afspraken Gemaakt"
              value={DEMO_DATA.afsprakenGemaakt}
              icon={Calendar}
              variant="success"
              calculationRule="Aantal succesvolle afspraken via callcenter"
            />
            <KPICard
              title="Conversie Lead → Afspraak"
              value={`${DEMO_DATA.conversieRatio}%`}
              icon={Target}
              calculationRule="Afspraken / Leads Gebeld × 100%"
            />
            <KPICard
              title="Gem. Afspraken/Agent"
              value={DEMO_DATA.gemAfsprakenPerAgent}
              icon={Users}
              calculationRule="Totaal afspraken / Aantal actieve agents"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <KPICard
              title="Gem. Call Duration"
              value={`${DEMO_DATA.gemCallDuration} min`}
              icon={Timer}
              calculationRule="Gemiddelde duur van alle calls"
            />
            <KPICard
              title="Valid Calls"
              value={DEMO_DATA.validCalls}
              subtitle="Confirmed + Lost + Abandoned"
              icon={PhoneCall}
              calculationRule="Calls met duidelijke status uitkomst"
            />
            <KPICard
              title="Voicemails"
              value={DEMO_DATA.voicemails}
              subtitle="Calls < 30 sec"
              icon={Voicemail}
              calculationRule="Calls korter dan 30 seconden"
            />
            <KPICard
              title="Productieve Calls"
              value={DEMO_DATA.productieveCalls}
              subtitle="> 30 sec"
              icon={Headphones}
              calculationRule="Calls langer dan 30 seconden"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <KPICard
              title="Productieve Calls/Uur"
              value={DEMO_DATA.productieveCallsPerUur.toFixed(1)}
              subtitle="Target: 30/uur"
              icon={Zap}
              calculationRule="Productieve calls / Netto beltijd in uren"
            />
            <KPICard
              title="Productieve Tijd"
              value={`${DEMO_DATA.productieveTijdPercentage}%`}
              icon={Activity}
              variant="success"
              calculationRule="Tijd actief aan het bellen vs totale werktijd"
            />
            <KPICard
              title="Idle Time"
              value={`${DEMO_DATA.idleTimePercentage}%`}
              icon={Clock}
              variant={DEMO_DATA.idleTimePercentage > 30 ? "warning" : "default"}
              calculationRule="Tijd niet aan het bellen (100% - Productieve tijd)"
            />
          </div>
        </div>

        {/* Section 2: Zeit & Productiviteit + Funnel */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Wekelijkse Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={DEMO_DATA.weeklyTrend}>
                  <defs>
                    <linearGradient id="colorLeadsCC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAfsprakenCC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(173, 80%, 40%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeadsCC)"
                  />
                  <Area
                    type="monotone"
                    dataKey="afspraken"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAfsprakenCC)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Call Center Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Call Center Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEMO_DATA.funnelData.map((item, index) => {
                  const prevValue = index > 0 ? DEMO_DATA.funnelData[index - 1].value : item.value;
                  const conversionRate = ((item.value / prevValue) * 100).toFixed(1);
                  const widthPercent = (item.value / DEMO_DATA.funnelData[0].value) * 100;

                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold">{item.value}</span>
                          {index > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {conversionRate}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-8 rounded-lg overflow-hidden bg-secondary/30">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: item.fill,
                            minWidth: '60px',
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {widthPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {((DEMO_DATA.productieveCalls / DEMO_DATA.leadsGebeld) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Connect Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">
                      {((DEMO_DATA.afsprakenGemaakt / DEMO_DATA.productieveCalls) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Appointment Conversion</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Agent Performance */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Agent Performance
          </h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Agent Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Afspraken</TableHead>
                      <TableHead className="text-right">Conversie</TableHead>
                      <TableHead className="text-right">Gem. Duration</TableHead>
                      <TableHead className="text-right">Calls/Uur</TableHead>
                      <TableHead className="text-right">Netto Beltijd</TableHead>
                      <TableHead className="text-right">Idle Time</TableHead>
                      <TableHead className="text-center">Werkdag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_DATA.agents.map((agent) => (
                      <TableRow 
                        key={agent.naam}
                        className={cn(
                          agent.ranking <= 3 && "bg-success/5"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankingIcon(agent.ranking)}
                            {!getRankingIcon(agent.ranking) && (
                              <span className="text-muted-foreground">{agent.ranking}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{agent.naam}</TableCell>
                        <TableCell className="text-right">{agent.calls}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          {agent.afspraken}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={agent.conversie >= 25 ? "default" : "secondary"}>
                            {agent.conversie}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{agent.gemCallDuration} min</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            agent.productieveCallsPerUur >= 30 ? "text-success" : "text-warning"
                          )}>
                            {agent.productieveCallsPerUur}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{agent.nettoBeltijd}u</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            agent.idleTime > 2.5 ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {agent.idleTime}u
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {agent.eersteCall} - {agent.laatsteCall}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Agent Vergelijking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">Agent 1</label>
                <Select value={selectedAgent1 || ""} onValueChange={setSelectedAgent1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_DATA.agents.map((agent) => (
                      <SelectItem key={agent.naam} value={agent.naam}>
                        {agent.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">Agent 2</label>
                <Select value={selectedAgent2 || ""} onValueChange={setSelectedAgent2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_DATA.agents.map((agent) => (
                      <SelectItem key={agent.naam} value={agent.naam}>
                        {agent.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {agent1 && agent2 && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <p className="font-semibold text-foreground">{agent1.naam}</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">Metriek</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <p className="font-semibold text-foreground">{agent2.naam}</p>
                </div>

                {[
                  { label: "Calls", key: "calls" },
                  { label: "Afspraken", key: "afspraken" },
                  { label: "Conversie", key: "conversie", suffix: "%" },
                  { label: "Calls/Uur", key: "productieveCallsPerUur" },
                  { label: "Netto Beltijd", key: "nettoBeltijd", suffix: "u" },
                  { label: "Idle Time", key: "idleTime", suffix: "u" },
                ].map((metric) => {
                  const val1 = agent1[metric.key as keyof typeof agent1] as number;
                  const val2 = agent2[metric.key as keyof typeof agent2] as number;
                  const isIdleTime = metric.key === "idleTime";
                  const agent1Better = isIdleTime ? val1 < val2 : val1 > val2;
                  const agent2Better = isIdleTime ? val2 < val1 : val2 > val1;

                  return (
                    <>
                      <div className={cn(
                        "text-center p-3 rounded-lg",
                        agent1Better && "bg-success/20"
                      )}>
                        <span className="text-xl font-bold">
                          {val1}{metric.suffix || ""}
                        </span>
                        {agent1Better && <ArrowUpRight className="inline w-4 h-4 text-success ml-1" />}
                      </div>
                      <div className="text-center p-3 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">{metric.label}</span>
                      </div>
                      <div className={cn(
                        "text-center p-3 rounded-lg",
                        agent2Better && "bg-success/20"
                      )}>
                        <span className="text-xl font-bold">
                          {val2}{metric.suffix || ""}
                        </span>
                        {agent2Better && <ArrowUpRight className="inline w-4 h-4 text-success ml-1" />}
                      </div>
                    </>
                  );
                })}
              </div>
            )}

            {(!agent1 || !agent2) && (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Selecteer twee agents om te vergelijken
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Beste Belmomenten */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Beste Belmomenten
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Heatmap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Connect Rate per Uur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {DEMO_DATA.besteTijden.map((tijd) => (
                    <div
                      key={tijd.uur}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center text-white transition-transform hover:scale-105 cursor-default"
                      style={{ backgroundColor: getHeatmapColor(tijd.connectRate, maxConnectRate) }}
                    >
                      <span className="text-xs font-medium">{tijd.uur}</span>
                      <span className="text-lg font-bold">{tijd.connectRate}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Laag</span>
                  <div className="flex gap-1">
                    {HEATMAP_COLORS.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-3 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span>Hoog</span>
                </div>
              </CardContent>
            </Card>

            {/* Best times bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Afspraken per Uur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={DEMO_DATA.besteTijden} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                    <XAxis dataKey="uur" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="afspraken" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 5: Lead Flow & Pipeline */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Lead Flow & Pipeline
          </h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Lead Flow per Sector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Binnengekomen</TableHead>
                      <TableHead className="text-right">Gebeld</TableHead>
                      <TableHead className="text-right">Afspraken</TableHead>
                      <TableHead className="text-right">Open Leads</TableHead>
                      <TableHead className="text-right">Gebeld %</TableHead>
                      <TableHead className="text-right">Conversie %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_DATA.leadFlowPerSector.map((sector) => (
                      <TableRow key={sector.sector}>
                        <TableCell className="font-medium">{sector.sector}</TableCell>
                        <TableCell className="text-right">{sector.binnengekomen}</TableCell>
                        <TableCell className="text-right">{sector.gebeld}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          {sector.afspraken}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={sector.openLeads > 30 ? "destructive" : "secondary"}>
                            {sector.openLeads}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {((sector.gebeld / sector.binnengekomen) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">
                            {((sector.afspraken / sector.gebeld) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 6: Call Quality & Status */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Call Quality & Status
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-success/10 border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-3xl font-bold text-success">{DEMO_DATA.callBreakdown.confirmed}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-success" />
                  </div>
                </div>
                <Progress 
                  value={(DEMO_DATA.callBreakdown.confirmed / DEMO_DATA.validCalls) * 100} 
                  className="mt-4 h-2" 
                />
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lost</p>
                    <p className="text-3xl font-bold text-destructive">{DEMO_DATA.callBreakdown.lost}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <PhoneOff className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <Progress 
                  value={(DEMO_DATA.callBreakdown.lost / DEMO_DATA.validCalls) * 100} 
                  className="mt-4 h-2" 
                />
              </CardContent>
            </Card>

            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Abandoned</p>
                    <p className="text-3xl font-bold text-warning">{DEMO_DATA.callBreakdown.abandoned}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-warning" />
                  </div>
                </div>
                <Progress 
                  value={(DEMO_DATA.callBreakdown.abandoned / DEMO_DATA.validCalls) * 100} 
                  className="mt-4 h-2" 
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Voicemail</p>
                    <p className="text-3xl font-bold text-muted-foreground">{DEMO_DATA.callBreakdown.voicemail}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Voicemail className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                <Progress 
                  value={(DEMO_DATA.callBreakdown.voicemail / (DEMO_DATA.validCalls + DEMO_DATA.voicemails)) * 100} 
                  className="mt-4 h-2" 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
