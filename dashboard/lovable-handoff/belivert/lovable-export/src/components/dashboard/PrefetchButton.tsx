
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Check, Loader2 } from "lucide-react";
import { FilterState } from "@/components/dashboard/FilterBar";
import {
  fetchWeeklyPerformanceData,
  getWeeklyPerformanceQueryKey
} from "@/hooks/useWeeklyPerformanceData";
import { useBrand } from "@/hooks/useBrand";
import { toast } from "sonner";

// Common date ranges to prefetch
const getDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const ranges: { label: string; dateFrom: string; dateTo: string }[] = [];

  // Last 7 days
  const sevenDaysAgo = new Date(yesterday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  ranges.push({
    label: "7 dagen",
    dateFrom: sevenDaysAgo.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // Last 14 days
  const fourteenDaysAgo = new Date(yesterday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  ranges.push({
    label: "14 dagen",
    dateFrom: fourteenDaysAgo.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // Last 30 days
  const thirtyDaysAgo = new Date(yesterday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  ranges.push({
    label: "30 dagen",
    dateFrom: thirtyDaysAgo.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // Last 60 days
  const sixtyDaysAgo = new Date(yesterday);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);
  ranges.push({
    label: "60 dagen",
    dateFrom: sixtyDaysAgo.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // Last 90 days
  const ninetyDaysAgo = new Date(yesterday);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  ranges.push({
    label: "90 dagen",
    dateFrom: ninetyDaysAgo.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // This month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  ranges.push({
    label: "deze maand",
    dateFrom: thisMonthStart.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  ranges.push({
    label: "vorige maand",
    dateFrom: lastMonthStart.toISOString().split("T")[0],
    dateTo: lastMonthEnd.toISOString().split("T")[0],
  });

  // This year
  const thisYearStart = new Date(today.getFullYear(), 0, 1);
  ranges.push({
    label: "dit jaar",
    dateFrom: thisYearStart.toISOString().split("T")[0],
    dateTo: yesterday.toISOString().split("T")[0],
  });

  return ranges;
};

// Default filters for prefetching
const getDefaultFilters = (dateFrom: string, dateTo: string): FilterState => ({
  dateFrom,
  dateTo,
  sectorId: "all",
  sourceId: "all",
  channelId: "all",
  provinceIds: [],
  partnerId: "all",
});

export function PrefetchButton() {
  const queryClient = useQueryClient();
  const { brands } = useBrand();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handlePrefetch = async () => {
    setIsPrefetching(true);
    setProgress(0);
    setIsDone(false);

    // Initial fetch of coverage data (or use cached if exists)
    const coverageData = await queryClient.fetchQuery({
      queryKey: ["postcodeCoverage", null],
      queryFn: async () => {
        const { data } = await supabase
          .from("postcode_coverage_aggregated")
          .select("postcode, province_id, brand_id, sector_ids, partner_ids");

        // Simple transform for prefetch purposes
        const flat: any[] = [];
        data?.forEach((row: any) => {
          row.sector_ids?.forEach((sid: any) => {
            row.partner_ids?.forEach((pid: any) => {
              flat.push({ postcode: row.postcode, sector_id: sid, partner_id: pid });
            });
          });
        });
        return flat;
      }
    });

    const safeCoverage = coverageData || [];

    const dateRanges = getDateRanges();
    // Prefetch for each brand + null (global)
    const brandIds = [null, ...brands.map(b => b.id)];
    const total = dateRanges.length * brandIds.length;
    let completed = 0;

    toast.info(`Data inladen voor ${brands.length + 1} brands × ${dateRanges.length} periodes...`);

    for (const brandId of brandIds) {
      for (const range of dateRanges) {
        const filters = getDefaultFilters(range.dateFrom, range.dateTo);
        const queryKey = getWeeklyPerformanceQueryKey(filters, brandId);

        // Check if already cached
        const existingData = queryClient.getQueryData(queryKey);
        if (!existingData) {
          try {
            const data = await fetchWeeklyPerformanceData(filters, brandId, safeCoverage);
            queryClient.setQueryData(queryKey, data);
          } catch (error) {
            console.error(`Error prefetching:`, error);
          }
        }

        completed++;
        setProgress(Math.round((completed / total) * 100));
      }
    }

    setIsPrefetching(false);
    setIsDone(true);
    toast.success("Alle data is ingeladen! Wisselen is nu instant.");

    // Reset done state after 3 seconds
    setTimeout(() => setIsDone(false), 3000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrefetch}
      disabled={isPrefetching}
      className="gap-2"
    >
      {isPrefetching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">{progress}%</span>
        </>
      ) : isDone ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="hidden sm:inline">Ingeladen</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Alle data inladen</span>
        </>
      )}
    </Button>
  );
}
