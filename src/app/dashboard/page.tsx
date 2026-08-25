export const dynamic = "force-dynamic";
import { 
  getDashboardStats, 
  getWeeklyTrend, 
  getMethodDistribution, 
  getRecentScans 
} from "./actions";
import { getDashboardPoin } from "./poin-actions";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  // Extract date range from search params if any
  const start = searchParams?.start || null;
  const end = searchParams?.end || null;
  const filterParams = { start, end };

  // Fetch initial data on the server side
  const [stats, trend, distribution, recentScans, poinStats] = await Promise.all([
    getDashboardStats(filterParams),
    getWeeklyTrend(filterParams),
    getMethodDistribution(filterParams),
    getRecentScans(filterParams),
    getDashboardPoin() // Poin maybe doesn't need date filter, or can add if needed
  ]);

  return (
    <div className="p-4 md:p-8">
      <DashboardClient 
        initialStats={stats}
        initialTrend={trend}
        initialDistribution={distribution}
        initialRecentScans={recentScans}
        initialPoinStats={poinStats}
        initialStart={start}
        initialEnd={end}
      />
    </div>
  );
}

