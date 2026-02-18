export type FilialKPI = {
    empresa_id: number;
    name: string;
    goal: number;
    realized: number;
    pct: number;
    missing: number;
};

export type WeeklySellerKPI = {
    seller_id: number;
    name: string;
    goal: number;
    realized: number;
    pct: number;
    weeks_met_count?: number;
};

export type MonthlySellerKPI = {
    seller_id: number;
    name: string;
    goal: number;
    realized: number;
    pct: number;
    weeks_met_count?: number;
};

export type GrowthRow = {
    month: string;
    total: number;
    goal: number;
    profit: number;
};

export type PositivitySellerKPI = {
    seller_id: number;
    name: string;
    wallet_total: number;
    wallet_positive: number;
    pct: number;
    weeks_met_count?: number;
};

export type AdminDashboardData = {
    filiais: FilialKPI[];
    general: {
        goal: number;
        realized: number;
        pct: number;
        missing: number;
        daysActive: number;
        daysTotal: number;
    };
    weeklySellers: WeeklySellerKPI[];
    monthlySellers: MonthlySellerKPI[];
    positivity: {
        percentage: number;
    };
    positivitySellers: PositivitySellerKPI[];
    profitability: {
        overall: number;
        noSolar: number;
        today: number;
        todayNoSolar: number;
    };
    growth: GrowthRow[];
    branchGrowth: Record<number, GrowthRow[]>;
};
