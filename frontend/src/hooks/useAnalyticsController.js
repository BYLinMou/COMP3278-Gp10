import { useCallback, useState } from "react";
import { getAnalyticsOverview } from "../api";

export function useAnalyticsController() {
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const overview = await getAnalyticsOverview();
      setAnalytics(overview);
      return overview;
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  return {
    analytics,
    isAnalyticsLoading,
    loadAnalytics,
  };
}
