import type {
  FullReport,
  ReportQuery,
  SalesSummary,
} from "../../../electron/shared/types/report";

type Query = Partial<ReportQuery>;

export const reportApi = {
  async full(query: Query = {}): Promise<FullReport> {
    return window.api.report.full(query);
  },

  async today(): Promise<SalesSummary> {
    return window.api.report.today();
  },
};