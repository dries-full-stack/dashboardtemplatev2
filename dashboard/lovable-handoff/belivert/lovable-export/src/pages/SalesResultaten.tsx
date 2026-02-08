import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Timer,
  AlertCircle,
  XCircle,
  Euro,
  Target,
  BarChart3,
  Users,
  CalendarClock,
  UserCircle,
  Award,
  Medal,
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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Demo data for the sales dashboard
const DEMO_DATA = {
  totaalAfspraken: 847,
  offertesGemaakt: 412,
  offertesGoedgekeurd: 198,
  offertesAfgekeurd: 89,
  offertesHangend: 125,
  gemiddeldeTijdTotOfferte: 2.4, // dagen
  gemiddeldeSalesCycle: 18.5, // dagen
  dealRatio: 23.4, // percentage
  kostPerKlant: 245.80,
  waardeHangendeOffertes: 156750,
  maandelijkseTarget: 25,
  behaaldeDealsDezeMaand: 21,

  // Trend data
  maandelijkseTrend: [
    { maand: "Jan", offertes: 32, deals: 8 },
    { maand: "Feb", offertes: 45, deals: 12 },
    { maand: "Mar", offertes: 38, deals: 9 },
    { maand: "Apr", offertes: 52, deals: 14 },
    { maand: "Mei", offertes: 48, deals: 11 },
    { maand: "Jun", offertes: 56, deals: 15 },
  ],

  // Lost reasons
  lostReasons: [
    { reden: "Te duur", aantal: 34, percentage: 38.2 },
    { reden: "Concurrent gekozen", aantal: 22, percentage: 24.7 },
    { reden: "Project uitgesteld", aantal: 18, percentage: 20.2 },
    { reden: "Geen budget", aantal: 10, percentage: 11.2 },
    { reden: "Overig", aantal: 5, percentage: 5.6 },
  ],

  // Pending quotes
  hangendeOffertes: [
    { klant: "Bakkerij Van Dijk", waarde: 12500, dagenOpen: 8, kans: "Hoog" },
    { klant: "Garage Jansen", waarde: 8750, dagenOpen: 14, kans: "Medium" },
    { klant: "Restaurant De Gouden Leeuw", waarde: 15200, dagenOpen: 3, kans: "Hoog" },
    { klant: "Kapsalon Elegance", waarde: 4500, dagenOpen: 21, kans: "Laag" },
    { klant: "Accountancy Peters", waarde: 22000, dagenOpen: 5, kans: "Hoog" },
  ],

  // Funnel data
  funnelData: [
    { name: "Afspraken", value: 847, fill: "#3B82F6" },
    { name: "Offertes", value: 412, fill: "#8B5CF6" },
    { name: "Goedgekeurd", value: 198, fill: "#10B981" },
  ],

  // Per-salesperson breakdown
  verkopers: [
    { 
      naam: "Jan van den Berg", 
      afspraken: 156, 
      offertes: 78, 
      deals: 42, 
      omzet: 84500,
      conversionRate: 26.9,
      gemSalesCycle: 14.2,
      ranking: 1
    },
    { 
      naam: "Lisa de Vries", 
      afspraken: 142, 
      offertes: 71, 
      deals: 38, 
      omzet: 76200,
      conversionRate: 26.8,
      gemSalesCycle: 16.5,
      ranking: 2
    },
    { 
      naam: "Peter Bakker", 
      afspraken: 128, 
      offertes: 62, 
      deals: 31, 
      omzet: 62400,
      conversionRate: 24.2,
      gemSalesCycle: 19.8,
      ranking: 3
    },
    { 
      naam: "Sophie Jansen", 
      afspraken: 134, 
      offertes: 68, 
      deals: 35, 
      omzet: 71000,
      conversionRate: 26.1,
      gemSalesCycle: 17.3,
      ranking: 4
    },
    { 
      naam: "Mark de Groot", 
      afspraken: 145, 
      offertes: 69, 
      deals: 28, 
      omzet: 56800,
      conversionRate: 19.3,
      gemSalesCycle: 22.1,
      ranking: 5
    },
    { 
      naam: "Emma Visser", 
      afspraken: 142, 
      offertes: 64, 
      deals: 24, 
      omzet: 48600,
      conversionRate: 16.9,
      gemSalesCycle: 24.5,
      ranking: 6
    },
  ],
};

const chartConfig = {
  offertes: {
    label: "Offertes",
    color: "hsl(var(--primary))",
  },
  deals: {
    label: "Deals",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig;

export default function SalesResultaten() {
  const [periodFilter, setPeriodFilter] = useState("6m");

  const kansKleur = (kans: string) => {
    switch (kans) {
      case "Hoog":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Laag":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const targetProgress = (DEMO_DATA.behaaldeDealsDezeMaand / DEMO_DATA.maandelijkseTarget) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales Resultaten</h1>
            <p className="text-muted-foreground">
              Volg de belangrijkste sales KPI's en offerte statistieken
            </p>
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecteer periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Afgelopen maand</SelectItem>
              <SelectItem value="3m">Afgelopen 3 maanden</SelectItem>
              <SelectItem value="6m">Afgelopen 6 maanden</SelectItem>
              <SelectItem value="1y">Afgelopen jaar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main KPIs Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Offertes Gemaakt"
            value={DEMO_DATA.offertesGemaakt}
            subtitle={`Van ${DEMO_DATA.totaalAfspraken} afspraken`}
            icon={FileText}
            calculationRule="Aantal offertes gegenereerd vanuit afspraken"
          />
          <KPICard
            title="Gem. Tijd tot Offerte"
            value={`${DEMO_DATA.gemiddeldeTijdTotOfferte} dagen`}
            subtitle="Na afspraak"
            icon={Clock}
            calculationRule="Gemiddelde tijd tussen afspraak en offerte generatie"
          />
          <KPICard
            title="Goedgekeurde Offertes"
            value={DEMO_DATA.offertesGoedgekeurd}
            subtitle={`${((DEMO_DATA.offertesGoedgekeurd / DEMO_DATA.offertesGemaakt) * 100).toFixed(1)}% approval rate`}
            icon={CheckCircle}
            variant="success"
            calculationRule="Aantal getekende offertes"
          />
          <KPICard
            title="Deal Ratio"
            value={`${DEMO_DATA.dealRatio}%`}
            subtitle="Afspraken → Deals"
            icon={TrendingUp}
            calculationRule="Percentage afspraken dat resulteert in een deal"
          />
        </div>

        {/* Main KPIs Row 2 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Gem. Sales Cycle"
            value={`${DEMO_DATA.gemiddeldeSalesCycle} dagen`}
            subtitle="Afspraak → Getekend"
            icon={Timer}
            calculationRule="Gemiddelde doorlooptijd van eerste afspraak tot getekende offerte"
          />
          <KPICard
            title="Hangende Offertes"
            value={DEMO_DATA.offertesHangend}
            subtitle={`€${DEMO_DATA.waardeHangendeOffertes.toLocaleString('nl-BE')} waarde`}
            icon={AlertCircle}
            variant="warning"
            calculationRule="Offertes die nog niet zijn goedgekeurd of afgekeurd"
          />
          <KPICard
            title="Afgekeurde Offertes"
            value={DEMO_DATA.offertesAfgekeurd}
            subtitle={`${((DEMO_DATA.offertesAfgekeurd / DEMO_DATA.offertesGemaakt) * 100).toFixed(1)}% rejection rate`}
            icon={XCircle}
            variant="danger"
            calculationRule="Aantal afgewezen offertes"
          />
          <KPICard
            title="Kost per Klant"
            value={DEMO_DATA.kostPerKlant}
            format="currency"
            subtitle="Acquisitiekost"
            icon={Euro}
            calculationRule="Totale marketing & sales kosten / aantal nieuwe klanten"
          />
        </div>

        {/* Deals vs Target + Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Target Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Deals vs Maandelijkse KPI
                </CardTitle>
                <Badge variant={targetProgress >= 100 ? "default" : targetProgress >= 75 ? "secondary" : "destructive"}>
                  {targetProgress >= 100 ? "Target behaald" : `${(100 - targetProgress).toFixed(0)}% te gaan`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-foreground">
                    {DEMO_DATA.behaaldeDealsDezeMaand}
                    <span className="text-lg font-normal text-muted-foreground ml-1">
                      / {DEMO_DATA.maandelijkseTarget}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">deals deze maand</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-primary">
                    {targetProgress.toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">van target</p>
                </div>
              </div>
              <Progress value={Math.min(targetProgress, 100)} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{DEMO_DATA.maandelijkseTarget / 2}</span>
                <span>{DEMO_DATA.maandelijkseTarget}</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Maandelijkse Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={DEMO_DATA.maandelijkseTrend} barGap={4}>
                  <XAxis dataKey="maand" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="offertes" fill="var(--color-offertes)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deals" fill="var(--color-deals)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Lost Reasons + Pending Quotes */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lost Reasons */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Afgekeurde Offertes - Redenen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEMO_DATA.lostReasons.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.reden}</span>
                      <span className="text-muted-foreground">{item.aantal} ({item.percentage}%)</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Quotes Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-warning" />
                  Hangende Offertes
                </CardTitle>
                <Badge variant="outline">
                  €{DEMO_DATA.waardeHangendeOffertes.toLocaleString('nl-BE')} totaal
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klant</TableHead>
                    <TableHead className="text-right">Waarde</TableHead>
                    <TableHead className="text-center">Dagen</TableHead>
                    <TableHead className="text-center">Kans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_DATA.hangendeOffertes.map((offerte, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{offerte.klant}</TableCell>
                      <TableCell className="text-right">
                        €{offerte.waarde.toLocaleString('nl-BE')}
                      </TableCell>
                      <TableCell className="text-center">{offerte.dagenOpen}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={kansKleur(offerte.kans)} variant="secondary">
                          {offerte.kans}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Visual Sales Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Sales Funnel
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversie van afspraken naar getekende deals
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              {/* Funnel stages */}
              {DEMO_DATA.funnelData.map((item, index) => {
                const prevValue = index > 0 ? DEMO_DATA.funnelData[index - 1].value : item.value;
                const conversionRate = ((item.value / prevValue) * 100).toFixed(1);
                const dropOff = prevValue - item.value;
                
                // Calculate width percentage (first item = 100%, subsequent items scale down)
                const widthPercent = (item.value / DEMO_DATA.funnelData[0].value) * 100;
                const minWidth = 35; // minimum width percentage
                const displayWidth = Math.max(widthPercent, minWidth);
                
                return (
                  <div key={item.name} className="w-full flex flex-col items-center">
                    {/* Arrow/connector from previous step */}
                    {index > 0 && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px]"
                            style={{ borderTopColor: DEMO_DATA.funnelData[index - 1].fill }}
                          />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                          <span className="text-sm font-semibold text-foreground">
                            {conversionRate}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({dropOff} verloren)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Funnel bar */}
                    <div
                      className="relative flex items-center justify-between px-6 py-5 rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-default"
                      style={{
                        width: `${displayWidth}%`,
                        backgroundColor: item.fill,
                        minWidth: '280px',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          {index === 0 && <CalendarClock className="w-5 h-5 text-white" />}
                          {index === 1 && <FileText className="w-5 h-5 text-white" />}
                          {index === 2 && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">{item.name}</p>
                          {index === 0 && (
                            <p className="text-white/70 text-xs">Totaal gevoerde gesprekken</p>
                          )}
                          {index === 1 && (
                            <p className="text-white/70 text-xs">Verzonden offertes</p>
                          )}
                          {index === 2 && (
                            <p className="text-white/70 text-xs">Getekende deals</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-2xl">{item.value}</p>
                        {index === 0 && (
                          <p className="text-white/70 text-xs">100%</p>
                        )}
                        {index > 0 && (
                          <p className="text-white/70 text-xs">
                            {((item.value / DEMO_DATA.funnelData[0].value) * 100).toFixed(1)}% totaal
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary stats below funnel */}
              <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-2xl">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-2xl font-bold text-blue-600">
                    {((DEMO_DATA.funnelData[1].value / DEMO_DATA.funnelData[0].value) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Afspraak → Offerte</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <p className="text-2xl font-bold text-purple-600">
                    {((DEMO_DATA.funnelData[2].value / DEMO_DATA.funnelData[1].value) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Offerte → Deal</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <p className="text-2xl font-bold text-green-600">
                    {((DEMO_DATA.funnelData[2].value / DEMO_DATA.funnelData[0].value) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Totale Conversie</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Salesperson Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-primary" />
                Prestaties per Verkoper
              </CardTitle>
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {DEMO_DATA.verkopers.length} verkopers
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Individuele performance metrics per teamlid
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Verkoper</TableHead>
                    <TableHead className="text-center">Afspraken</TableHead>
                    <TableHead className="text-center">Offertes</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-center">Conversie</TableHead>
                    <TableHead className="text-center">Gem. Cyclus</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_DATA.verkopers.map((verkoper) => (
                    <TableRow key={verkoper.naam} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {verkoper.ranking === 1 && (
                            <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Award className="w-4 h-4 text-yellow-600" />
                            </div>
                          )}
                          {verkoper.ranking === 2 && (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <Medal className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          {verkoper.ranking === 3 && (
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                              <Medal className="w-4 h-4 text-orange-600" />
                            </div>
                          )}
                          {verkoper.ranking > 3 && (
                            <span className="text-muted-foreground font-medium">{verkoper.ranking}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {verkoper.naam.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium">{verkoper.naam}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{verkoper.afspraken}</TableCell>
                      <TableCell className="text-center">{verkoper.offertes}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">{verkoper.deals}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            verkoper.conversionRate >= 25 && "bg-green-100 text-green-800",
                            verkoper.conversionRate >= 20 && verkoper.conversionRate < 25 && "bg-yellow-100 text-yellow-800",
                            verkoper.conversionRate < 20 && "bg-red-100 text-red-800"
                          )}
                        >
                          {verkoper.conversionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "text-sm",
                          verkoper.gemSalesCycle <= 16 && "text-green-600",
                          verkoper.gemSalesCycle > 16 && verkoper.gemSalesCycle <= 20 && "text-yellow-600",
                          verkoper.gemSalesCycle > 20 && "text-red-600"
                        )}>
                          {verkoper.gemSalesCycle} dagen
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{verkoper.omzet.toLocaleString('nl-BE')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Team Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {DEMO_DATA.verkopers.reduce((sum, v) => sum + v.deals, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Totaal Deals</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  €{DEMO_DATA.verkopers.reduce((sum, v) => sum + v.omzet, 0).toLocaleString('nl-BE')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Totaal Omzet</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {(DEMO_DATA.verkopers.reduce((sum, v) => sum + v.conversionRate, 0) / DEMO_DATA.verkopers.length).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gem. Conversie</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {(DEMO_DATA.verkopers.reduce((sum, v) => sum + v.gemSalesCycle, 0) / DEMO_DATA.verkopers.length).toFixed(1)} d
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gem. Sales Cycle</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
