export const dynamic = "force-dynamic";
import { 
  getDashboardStats, 
  getWeeklyTrend, 
  getMethodDistribution, 
  getRecentScans 
} from "./actions";
import { getDashboardPoin } from "./poin-actions";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  // Fetch initial data on the server side
  const [stats, trend, distribution, recentScans, poinStats] = await Promise.all([
    getDashboardStats(),
    getWeeklyTrend(),
    getMethodDistribution(),
    getRecentScans(),
    getDashboardPoin()
  ]);

  return (
    <div className="p-4 md:p-8">
      <DashboardClient 
        initialStats={stats}
        initialTrend={trend}
        initialDistribution={distribution}
        initialRecentScans={recentScans}
        initialPoinStats={poinStats}
      />
    </div>
  );
}

