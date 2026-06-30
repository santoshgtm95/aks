import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  dashboardAPI,
  productsAPI,
  salesAPI,
  washGradingAPI,
  processingAPI,
  purificationAPI,
  refinementAPI,
  singleDoubleDrawnAPI,
  exportAPI,
  semiExportPurchaseAPI,
  semiExportAPI,
} from "../../services/api";
import type { DashboardStats, MarkerSortingStats } from "../../types";
import Modal from "../../components/Modal";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  BarChart2,
  Tag,
  Scale,
  TrendingUp,
  Layers,
  Palette,
  Droplet,
  Users,
  Compass,
  FileText,
  Package,
  ShoppingCart,
  RefreshCw,
  Globe,
  ArrowRight,
  Truck,
} from "lucide-react";
import "./index.css";

type SortField =
  | "marker"
  | "totalSorted"
  | "totalLost"
  | "totalSpoilage"
  | "totalReturns"
  | "recordCount";
type SortDir = "asc" | "desc";

const fmt = (n: number) => n.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtInt = (n: number) => Math.round(n).toLocaleString();
const fmtCur = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/* ─── Mini Bar Chart ─────────────────────────────────── */
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  unit?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 160,
  showValues = true,
  unit = "",
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(18, Math.min(52, Math.floor(560 / data.length) - 10));

  return (
    <div className="bar-chart-wrap">
      <svg
        viewBox={`0 0 ${data.length * (barW + 12)} ${height + 40}`}
        style={{ width: "100%", height: height + 40 }}
      >
        {data.map((d, i) => {
          const barH = Math.max(4, ((d.value / max) * height * 0.85));
          const x = i * (barW + 12) + 6;
          const y = height - barH + 4;
          const color = d.color || "#6366f1";
          return (
            <g key={i}>
              {/* background track */}
              <rect
                x={x}
                y={4}
                width={barW}
                height={height * 0.85}
                rx={6}
                fill="rgba(99,102,241,0.06)"
              />
              {/* bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={color}
                opacity={0.88}
              />
              {/* value label */}
              {showValues && d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={barW > 28 ? 9 : 7}
                  fill="#64748b"
                  fontWeight="600"
                >
                  {d.value >= 1000
                    ? (d.value / 1000).toFixed(1) + "k"
                    : d.value.toFixed(1)}
                  {unit}
                </text>
              )}
              {/* x-axis label */}
              <text
                x={x + barW / 2}
                y={height + 20}
                textAnchor="middle"
                fontSize={barW > 32 ? 9.5 : 7}
                fill="#94a3b8"
                fontWeight="500"
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ─── Donut Chart ──────────────────────────────────────── */
interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

const DonutChart: React.FC<DonutProps> = ({ segments, size = 110 }) => {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset + circ * 0.25}
            opacity={0.85}
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={26} fill="#fff" />
    </svg>
  );
};

/* ─── KPI Card ─────────────────────────────────────────── */
const KpiCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: "up" | "down" | "neutral";
  delay?: string;
}> = ({ title, value, sub, icon, accent, trend, delay = "0s" }) => (
  <div className="kpi-card fade-in" style={{ animationDelay: delay }}>
    <div className="kpi-icon-wrap" style={{ background: accent }}>
      {icon}
    </div>
    <div className="kpi-body">
      <p className="kpi-label">{title}</p>
      <h3 className="kpi-value">{value}</h3>
      {sub && (
        <p className="kpi-sub">
          {trend === "up" && (
            <ArrowUpRight size={11} style={{ color: "#10b981" }} />
          )}
          {trend === "down" && (
            <ArrowDownRight size={11} style={{ color: "#ef4444" }} />
          )}
          {sub}
        </p>
      )}
    </div>
    <div className="kpi-glow" style={{ background: accent }} />
  </div>
);

/* ─── Sort Icon ─────────────────────────────────────────── */
const SortIcon: React.FC<{
  field: SortField;
  current: SortField;
  dir: SortDir;
}> = ({ field, current, dir }) => {
  if (field !== current) return <Minus size={12} style={{ opacity: 0.3 }} />;
  return dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
};

/* ─── Section Card ──────────────────────────────────────── */
const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: string | number;
  children: React.ReactNode;
  accent?: string;
}> = ({ icon, title, badge, children, accent = "#6366f1" }) => (
  <div className="section-card fade-in">
    <div className="section-header">
      <div className="section-title-row">
        <span className="section-icon" style={{ color: accent }}>
          {icon}
        </span>
        <h2 className="section-title">{title}</h2>
        {badge !== undefined && (
          <span className="section-badge" style={{ background: accent + "22", color: accent }}>
            {badge}
          </span>
        )}
      </div>
    </div>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalSorted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Marker detail modal
  const [selectedMarkerName, setSelectedMarkerName] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [detailsTab, setDetailsTab] = useState("inventory");

  // Extra data
  const [exports, setExports] = useState<any[]>([]);
  const [semiExportPurchases, setSemiExportPurchases] = useState<any[]>([]);
  const [semiExports, setSemiExports] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        statsData,
        exportsData,
        semiExportPurchasesData,
        semiExportsData,
        productsData,
        salesData,
      ] = await Promise.all([
        dashboardAPI.getStats(),
        exportAPI.getAll().catch(() => []),
        semiExportPurchaseAPI.getAll().catch(() => []),
        semiExportAPI.getAll().catch(() => []),
        productsAPI.getAll(true).catch(() => []),
        salesAPI.getAll().catch(() => []),
      ]);
      setStats(statsData);
      setExports(exportsData);
      setSemiExportPurchases(semiExportPurchasesData);
      setSemiExports(semiExportsData);
      setAllProducts(productsData);
      setAllSales(salesData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ─── Sort / filter markers ─── */
  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const filteredMarkers = useMemo<MarkerSortingStats[]>(() => {
    if (!stats) return [];
    const arr = stats.markerSortingStats ?? [];
    const q = search.toLowerCase();
    return [...arr]
      .filter(
        (m) =>
          m.marker.toLowerCase().includes(q) ||
          m.warehouseName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const mul = sortDir === "asc" ? 1 : -1;
        if (typeof av === "string" && typeof bv === "string")
          return mul * av.localeCompare(bv);
        return mul * ((av as number) - (bv as number));
      });
  }, [stats, search, sortField, sortDir]);

  const totals = useMemo(() => {
    if (!stats) return null;
    const arr = stats.markerSortingStats ?? [];
    if (!arr.length) return null;
    return arr.reduce(
      (acc, m) => ({
        sorted: acc.sorted + m.totalSorted,
        lost: acc.lost + m.totalLost,
        spoilage: acc.spoilage + m.totalSpoilage,
        returns: acc.returns + m.totalReturns,
      }),
      { sorted: 0, lost: 0, spoilage: 0, returns: 0 }
    );
  }, [stats]);

  /* ─── Computed aggregates ─── */

  // Inventory KPIs
  const inventoryMetrics = useMemo(() => {
    const active = allProducts.filter((p) => p.isActive && p.remainingWeight > 0);
    const totalRemainingKg = active.reduce((a, p) => a + (p.remainingWeight || 0), 0);
    const totalOriginalKg = allProducts
      .filter((p) => p.isActive)
      .reduce((a, p) => a + (p.weight || 0), 0);
    const usedPct = totalOriginalKg > 0 ? ((totalOriginalKg - totalRemainingKg) / totalOriginalKg) * 100 : 0;
    return { active: active.length, totalRemainingKg, totalOriginalKg, usedPct };
  }, [allProducts]);

  // Sales aggregates
  const salesMetrics = useMemo(() => {
    const totalAmt = allSales.reduce((a, s) => a + (s.weight || 0) * (s.price || 0), 0);
    const totalWt = allSales.reduce((a, s) => a + (s.weight || 0), 0);
    return { count: allSales.length, totalAmt, totalWt };
  }, [allSales]);

  // Export aggregates
  const exportMetrics = useMemo(() => {
    const totalAmt = exports.reduce((a, e) => a + (e.grandTotalMMK || 0), 0);
    const totalWt = exports.reduce((a, e) => a + (e.totalExportWeightViss || 0), 0);
    const totalCNY = exports.reduce((a, e) => a + (e.productAmountCNY || 0), 0);
    return { count: exports.length, totalAmt, totalWt, totalCNY };
  }, [exports]);

  // Semi-Export Purchase aggregates
  const semiPurchaseMetrics = useMemo(() => {
    const totalWt = semiExportPurchases.reduce((a, s) => a + (s.totalReceiveWeight || 0), 0);
    const byColor: Record<string, number> = {};
    semiExportPurchases.forEach((s) => {
      const c = s.color || "Unknown";
      byColor[c] = (byColor[c] || 0) + (s.totalReceiveWeight || 0);
    });
    return { count: semiExportPurchases.length, totalWt, byColor };
  }, [semiExportPurchases]);

  // Semi-Export aggregates
  const _semiExportMetrics = useMemo(() => {
    const totalWt = semiExports.reduce((a, s) => a + (s.totalWeight || 0), 0);
    return { count: semiExports.length, totalWt };
  }, [semiExports]);
  void _semiExportMetrics;

  /* ─── Bar chart data ─── */

  // Top 8 markers by sorted weight
  const markerBarData = useMemo(() => {
    if (!stats) return [];
    const PALETTE = [
      "#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#f97316","#06b6d4",
    ];
    return (stats.markerSortingStats ?? [])
      .slice(0, 8)
      .map((m, i) => ({
        label: m.marker,
        value: parseFloat(m.totalSorted.toFixed(2)),
        color: PALETTE[i % PALETTE.length],
      }));
  }, [stats]);

  // Export by ledger bar data
  const exportBarData = useMemo(() => {
    const byLedger: Record<string, number> = {};
    exports.forEach((e) => {
      const key = e.ledgerName || "Unknown";
      byLedger[key] = (byLedger[key] || 0) + (e.totalExportWeightViss || 0);
    });
    const PALETTE = ["#10b981","#0ea5e9","#6366f1","#f59e0b","#ec4899","#8b5cf6"];
    return Object.entries(byLedger)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([label, value], i) => ({
        label,
        value: parseFloat(value.toFixed(2)),
        color: PALETTE[i % PALETTE.length],
      }));
  }, [exports]);

  // Semi-export purchase by color bar data
  const semiPurchaseBarData = useMemo(() => {
    const PALETTE = ["#ec4899","#f59e0b","#0ea5e9","#10b981","#6366f1","#f97316","#8b5cf6"];
    return Object.entries(semiPurchaseMetrics.byColor)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([label, value], i) => ({
        label,
        value: parseFloat(value.toFixed(2)),
        color: PALETTE[i % PALETTE.length],
      }));
  }, [semiPurchaseMetrics]);

  // Sorting loss comparison bar
  const lossBarData = useMemo(() => {
    if (!stats) return [];
    return (stats.markerSortingStats ?? [])
      .filter((m) => m.totalLost > 0)
      .sort((a, b) => b.totalLost - a.totalLost)
      .slice(0, 8)
      .map((m) => ({
        label: m.marker,
        value: parseFloat(m.totalLost.toFixed(2)),
        color: "#ef4444",
      }));
  }, [stats]);

  // Inventory remaining donut data
  const inventoryDonutData = useMemo(() => {
    const used = inventoryMetrics.totalOriginalKg - inventoryMetrics.totalRemainingKg;
    return [
      { label: "Remaining", value: inventoryMetrics.totalRemainingKg, color: "#6366f1" },
      { label: "Used/Sold", value: Math.max(0, used), color: "#e2e8f0" },
    ];
  }, [inventoryMetrics]);

  /* ─── Marker details modal ─── */
  const handleViewDetails = async (markerName: string) => {
    setSelectedMarkerName(markerName);
    setDetailsLoading(true);
    setDetailsTab("inventory");
    try {
      const [
        productsList, salesList, washGradingList, processingList,
        purificationList, refinementList, sddList,
      ] = await Promise.all([
        productsAPI.getAll(true),
        salesAPI.getAll("Sales"),
        washGradingAPI.getRecords(),
        processingAPI.getAll(),
        purificationAPI.getPurifiedRecords(),
        refinementAPI.getRefinementRecords(),
        singleDoubleDrawnAPI.getAll(),
      ]);

      const ml = markerName.toLowerCase();
      const filteredProducts = productsList.filter((p) => p.marker?.toLowerCase() === ml);
      const filteredSales = salesList.filter(
        (s) => s.productMarker?.toLowerCase() === ml || s.marker?.toLowerCase() === ml
      );
      const filteredWashGrading = washGradingList.filter((wg) => wg.productMarker?.toLowerCase() === ml);
      const filteredProcessing = processingList.filter((p) => p.productMarker?.toLowerCase() === ml);
      const filteredPurification = purificationList.filter((pu) => pu.productMarker?.toLowerCase() === ml);
      const filteredRefinement = refinementList.filter((r) => r.productMarker?.toLowerCase() === ml);
      const filteredSdd = sddList.filter(
        (sdd) => sdd.refinementRecordMarker?.toLowerCase() === ml
      );

      let origKg = 0, origViss = 0, remKg = 0, remViss = 0, totalPrice = 0;
      let currency = "MMK", unit = "kg";
      const warehouseNamesSet = new Set<string>();

      filteredProducts.forEach((p) => {
        const w = p.weight || 0, rem = p.remainingWeight || 0;
        if (p.unit === "kg") { origKg += w; origViss += w / 1.633; remKg += rem; remViss += rem / 1.633; }
        else { origViss += w; origKg += w * 1.633; remViss += rem; remKg += rem * 1.633; }
        totalPrice += p.price || 0;
        currency = p.currency || "MMK"; unit = p.unit || "kg";
        if (p.warehouseName) warehouseNamesSet.add(p.warehouseName);
      });

      let soldKg = 0, soldViss = 0, totalSalesAmt = 0;
      filteredSales.forEach((s) => {
        const w = s.weight || 0;
        if (s.unit === "kg") { soldKg += w; soldViss += w / 1.633; }
        else { soldViss += w; soldKg += w * 1.633; }
        totalSalesAmt += w * (s.price || 0);
      });

      let washWt = 0, washLost = 0, washStock = 0, washFees = 0;
      filteredWashGrading.forEach((wg) => {
        washWt += wg.weight || 0; washLost += wg.lostWeight || 0;
        washStock += wg.remainingWeight || 0; washFees += wg.workerFees || 0;
      });

      let mlLost = 0, mlFees = 0;
      const mlColors: Record<string, { weight: number; count: number }> = {};
      const initColor = (name: string) => { if (!mlColors[name]) mlColors[name] = { weight: 0, count: 0 }; };
      filteredProcessing.forEach((p) => {
        mlLost += p.lossWeight || 0; mlFees += p.workerFees || 0;
        [["Red",p.redWeight,p.redCount],["White",p.whiteWeight,p.whiteCount],["Special",p.specialWeight,p.specialCount],
         ["Natural",p.naturalWeight,p.naturalCount],["Natural White",p.naturalWhiteWeight,p.naturalWhiteCount],
         ["Natural Red",p.naturalRedWeight,p.naturalRedCount],["Short Cut",p.shortCutWeight,p.shortCutCount],
         ["Artificial",p.artificialWeight,p.artificialCount],["Short",p.shortWeight,p.shortCount]
        ].forEach(([name, wt, cnt]) => {
          if (wt || cnt) {
            initColor(name as string);
            mlColors[name as string].weight += (wt as number) || 0;
            mlColors[name as string].count += (cnt as number) || 0;
          }
        });
      });

      let purWt = 0, purCnt = 0, purFees = 0, purSupFees = 0;
      filteredPurification.forEach((pu) => {
        purWt += pu.weight || 0; purCnt += pu.count || 0;
        purFees += pu.workerFees || 0; purSupFees += pu.supervisorFees || 0;
      });

      let refWt = 0, refCnt = 0, refLost = 0, refSpoil = 0, refRet = 0, refFees = 0;
      filteredRefinement.forEach((r) => {
        refWt += r.weight || 0; refCnt += r.count || 0; refLost += r.lostWeight || 0;
        refSpoil += r.spoilageWeight || 0; refRet += r.returnWeight || 0; refFees += r.workerFees || 0;
      });

      let sddFees = 0, sddLost = 0, sddSpoil = 0, sddRet = 0, sddSDLost = 0;
      const sddSizes: Record<string, number> = {
        "Size 6":0,"Size 7":0,"Size 8":0,"Size 9":0,"Size 10":0,"Size 10B":0,
        "Size 12":0,"Size 14":0,"Size 16":0,"Size 18":0,"Size 20":0,"Size 22":0,
        "Size 24":0,"Size 26":0,"Size 28":0,"Size Bar":0,
      };
      filteredSdd.forEach((s) => {
        sddFees += s.workerFees || 0; sddLost += s.lostWeight || 0;
        sddSpoil += s.spoilageWeight || 0; sddRet += s.returnWeight || 0;
        sddSDLost += s.singleDoubleLostWeight || 0;
        sddSizes["Size 6"] += s.size6 || 0; sddSizes["Size 7"] += s.size7 || 0;
        sddSizes["Size 8"] += s.size8 || 0; sddSizes["Size 9"] += s.size9 || 0;
        sddSizes["Size 10"] += s.size10 || 0; sddSizes["Size 10B"] += s.size10B || 0;
        sddSizes["Size 12"] += s.size12 || 0; sddSizes["Size 14"] += s.size14 || 0;
        sddSizes["Size 16"] += s.size16 || 0; sddSizes["Size 18"] += s.size18 || 0;
        sddSizes["Size 20"] += s.size20 || 0; sddSizes["Size 22"] += s.size22 || 0;
        sddSizes["Size 24"] += s.size24 || 0; sddSizes["Size 26"] += s.size26 || 0;
        sddSizes["Size 28"] += s.size28 || 0; sddSizes["Size Bar"] += s.sizeBar || 0;
      });
      const totalSortedWt = Object.values(sddSizes).reduce((a, b) => a + b, 0);
      const grandTotalFees = washFees + mlFees + purFees + purSupFees + refFees + sddFees;

      setDetailsData({
        products: filteredProducts, sales: filteredSales,
        washGrading: filteredWashGrading, processing: filteredProcessing,
        purification: filteredPurification, refinement: filteredRefinement, sdd: filteredSdd,
        metrics: {
          originalWeightKg: origKg, originalWeightViss: origViss,
          remainingWeightKg: remKg, remainingWeightViss: remViss,
          price: filteredProducts.length > 0 ? filteredProducts[0].price : 0,
          currency, unit,
          warehouseNames: Array.from(warehouseNamesSet).join(", ") || "—",
          soldWeightKg: soldKg, soldWeightViss: soldViss, totalSalesAmount: totalSalesAmt,
          washWeight: washWt, washLostWeight: washLost, washWashedStock: washStock, washWorkerFees: washFees,
          mlLostWeight: mlLost, mlWorkerFees: mlFees, mlColors,
          purifyWeight: purWt, purifyCount: purCnt, purifyWorkerFees: purFees, purifySupervisorFees: purSupFees,
          refineWeight: refWt, refineCount: refCnt, refineLostWeight: refLost,
          refineSpoilageWeight: refSpoil, refineReturnWeight: refRet, refineWorkerFees: refFees,
          sddWorkerFees: sddFees, sddLostWeight: sddLost, sddSpoilageWeight: sddSpoil,
          sddReturnWeight: sddRet, sddSingleDoubleLostWeight: sddSDLost,
          sddSizes, totalSortedWeight: totalSortedWt, grandTotalFees,
        },
      });
    } catch (e) {
      console.error("Error loading marker details:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-pulse-ring" />
        <div className="db-pulse-ring" style={{ animationDelay: "0.2s" }} />
        <div className="db-pulse-ring" style={{ animationDelay: "0.4s" }} />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  /* ─── RENDER ─── */
  return (
    <div className="db-root fade-in">

      {/* ── Header ── */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Operations Dashboard</h1>
          <p className="db-subtitle">
            Real-time overview · Inventory · Export · Semi-Export · Sorting
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="db-live-badge">
            <span className="db-live-dot" />
            Live Data
          </div>
          <button
            className="db-refresh-btn"
            onClick={loadAll}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? "spinning" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI Row 1: Inventory & Sales ── */}
      <div className="kpi-grid">
        <KpiCard
          delay="0s"
          title="Total Inventory"
          value={`${fmt(inventoryMetrics.totalRemainingKg)} kg`}
          sub={`${inventoryMetrics.active} active products`}
          icon={<Package size={22} color="#fff" />}
          accent="linear-gradient(135deg,#6366f1,#4f46e5)"
          trend="neutral"
        />
        <KpiCard
          delay="0.05s"
          title="Inventory Usage"
          value={`${inventoryMetrics.usedPct.toFixed(1)}%`}
          sub={`${fmt(inventoryMetrics.totalOriginalKg)} kg original`}
          icon={<Scale size={22} color="#fff" />}
          accent="linear-gradient(135deg,#0ea5e9,#0284c7)"
          trend={inventoryMetrics.usedPct > 60 ? "up" : "neutral"}
        />
        <KpiCard
          delay="0.10s"
          title="Total Sales"
          value={fmtInt(salesMetrics.totalAmt) + " MMK"}
          sub={`${salesMetrics.count} transactions`}
          icon={<ShoppingCart size={22} color="#fff" />}
          accent="linear-gradient(135deg,#10b981,#059669)"
          trend="up"
        />
        <KpiCard
          delay="0.15s"
          title="Total Exports"
          value={`${fmt(exportMetrics.totalWt)} viss`}
          sub={`${exportMetrics.count} export records`}
          icon={<Globe size={22} color="#fff" />}
          accent="linear-gradient(135deg,#f59e0b,#d97706)"
          trend="up"
        />
        <KpiCard
          delay="0.20s"
          title="Export Revenue"
          value={fmtCur(exportMetrics.totalAmt) + " MMK"}
          sub={`${fmtCur(exportMetrics.totalCNY)} CNY`}
          icon={<TrendingUp size={22} color="#fff" />}
          accent="linear-gradient(135deg,#ec4899,#db2777)"
          trend="up"
        />
        <KpiCard
          delay="0.25s"
          title="Semi-Export Purchase"
          value={`${fmt(semiPurchaseMetrics.totalWt)} viss`}
          sub={`${semiPurchaseMetrics.count} purchase records`}
          icon={<Truck size={22} color="#fff" />}
          accent="linear-gradient(135deg,#8b5cf6,#7c3aed)"
          trend="neutral"
        />
        <KpiCard
          delay="0.30s"
          title="Total Sorted"
          value={totals ? `${fmt(totals.sorted)} viss` : "—"}
          sub={`${(stats?.markerSortingStats ?? []).length} markers`}
          icon={<Layers size={22} color="#fff" />}
          accent="linear-gradient(135deg,#06b6d4,#0891b2)"
          trend="neutral"
        />
        <KpiCard
          delay="0.35s"
          title="Total Lost"
          value={totals ? `${fmt(totals.lost)} viss` : "—"}
          sub="across all markers"
          icon={<ArrowDownRight size={22} color="#fff" />}
          accent="linear-gradient(135deg,#ef4444,#dc2626)"
          trend="down"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-grid">

        {/* Top Markers Bar Chart */}
        <SectionCard
          icon={<BarChart2 size={20} />}
          title="Top Markers — Sorted Weight"
          badge={`${markerBarData.length} markers`}
          accent="#6366f1"
        >
          {markerBarData.length > 0 ? (
            <>
              <BarChart data={markerBarData} height={150} unit=" v" />
              <div className="chart-legend">
                {markerBarData.map((d, i) => (
                  <span key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} />
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No sorting data yet</div>
          )}
        </SectionCard>

        {/* Export by Ledger Bar Chart */}
        <SectionCard
          icon={<Globe size={20} />}
          title="Export Weight by Ledger"
          badge={`${exports.length} records`}
          accent="#f59e0b"
        >
          {exportBarData.length > 0 ? (
            <>
              <BarChart data={exportBarData} height={150} unit=" v" />
              <div className="chart-legend">
                {exportBarData.map((d, i) => (
                  <span key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} />
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No export data yet</div>
          )}
        </SectionCard>

        {/* Semi-Export Purchase by Color */}
        <SectionCard
          icon={<Truck size={20} />}
          title="Semi-Export Purchase — By Color"
          badge={`${semiExportPurchases.length} records`}
          accent="#8b5cf6"
        >
          {semiPurchaseBarData.length > 0 ? (
            <>
              <BarChart data={semiPurchaseBarData} height={150} unit=" v" />
              <div className="chart-legend">
                {semiPurchaseBarData.map((d, i) => (
                  <span key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} />
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No semi-export purchase data yet</div>
          )}
        </SectionCard>

        {/* Loss by Marker */}
        <SectionCard
          icon={<ArrowDownRight size={20} />}
          title="Loss Weight by Marker"
          badge="Top 8"
          accent="#ef4444"
        >
          {lossBarData.length > 0 ? (
            <BarChart data={lossBarData} height={150} unit=" v" />
          ) : (
            <div className="chart-empty">No loss data recorded</div>
          )}
        </SectionCard>
      </div>

      {/* ── Inventory Donut + Export Summary ── */}
      <div className="side-panels-grid">

        {/* Inventory Donut */}
        <SectionCard
          icon={<Package size={18} />}
          title="Inventory Status"
          accent="#6366f1"
        >
          <div className="donut-panel">
            <DonutChart segments={inventoryDonutData} size={120} />
            <div className="donut-legend">
              <div className="donut-item">
                <span className="donut-dot" style={{ background: "#6366f1" }} />
                <div>
                  <p className="donut-item-label">Remaining</p>
                  <p className="donut-item-val">{fmt(inventoryMetrics.totalRemainingKg)} kg</p>
                </div>
              </div>
              <div className="donut-item">
                <span className="donut-dot" style={{ background: "#e2e8f0" }} />
                <div>
                  <p className="donut-item-label">Used / Sold</p>
                  <p className="donut-item-val">
                    {fmt(Math.max(0, inventoryMetrics.totalOriginalKg - inventoryMetrics.totalRemainingKg))} kg
                  </p>
                </div>
              </div>
              <div className="donut-pct-badge">
                {inventoryMetrics.usedPct.toFixed(0)}% used
              </div>
            </div>
          </div>
          {/* Low stock table */}
          {(stats?.lowStockProducts ?? []).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="sub-table-label">⚠ Low Stock Products</p>
              <div className="details-table-wrapper">
                <table className="details-inner-table">
                  <thead>
                    <tr>
                      <th>Marker</th>
                      <th style={{ textAlign: "right" }}>Remaining</th>
                      <th style={{ textAlign: "right" }}>Original</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.lowStockProducts ?? []).slice(0, 5).map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.marker || "—"}</td>
                        <td style={{ textAlign: "right", color: "#ef4444", fontWeight: 700 }}>
                          {fmt(p.remainingWeight)} {p.unit}
                        </td>
                        <td style={{ textAlign: "right", color: "#94a3b8" }}>
                          {fmt(p.weight)} {p.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Export Summary */}
        <SectionCard
          icon={<Globe size={18} />}
          title="Export Records"
          badge={exportMetrics.count}
          accent="#f59e0b"
        >
          <div className="export-summary-stats">
            <div className="exp-stat">
              <span className="exp-stat-label">Total Weight</span>
              <span className="exp-stat-val amber">{fmt(exportMetrics.totalWt)} viss</span>
            </div>
            <div className="exp-stat">
              <span className="exp-stat-label">Grand Total (MMK)</span>
              <span className="exp-stat-val">{fmtCur(exportMetrics.totalAmt)} MMK</span>
            </div>
            <div className="exp-stat">
              <span className="exp-stat-label">Product Amount (CNY)</span>
              <span className="exp-stat-val green">{fmtCur(exportMetrics.totalCNY)} CNY</span>
            </div>
          </div>
          <div className="details-table-wrapper" style={{ marginTop: 12 }}>
            <table className="details-inner-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ledger</th>
                  <th style={{ textAlign: "right" }}>Weight (viss)</th>
                  <th style={{ textAlign: "right" }}>Total (MMK)</th>
                </tr>
              </thead>
              <tbody>
                {exports.slice(0, 8).map((e: any) => (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.ledgerName || "—"}</td>
                    <td style={{ textAlign: "right" }}>{fmt(e.totalExportWeightViss || 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {fmtCur(e.grandTotalMMK || 0)}
                    </td>
                  </tr>
                ))}
                {exports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-row">No export records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Semi-Export Purchase Summary */}
        <SectionCard
          icon={<Truck size={18} />}
          title="Semi-Export Purchase"
          badge={semiPurchaseMetrics.count}
          accent="#8b5cf6"
        >
          <div className="export-summary-stats">
            <div className="exp-stat">
              <span className="exp-stat-label">Total Received Weight</span>
              <span className="exp-stat-val purple">{fmt(semiPurchaseMetrics.totalWt)} viss</span>
            </div>
            <div className="exp-stat">
              <span className="exp-stat-label">Color Breakdown</span>
              <span className="exp-stat-val">{Object.keys(semiPurchaseMetrics.byColor).length} colors</span>
            </div>
          </div>
          <div className="details-table-wrapper" style={{ marginTop: 12 }}>
            <table className="details-inner-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Color</th>
                  <th style={{ textAlign: "right" }}>Weight (viss)</th>
                </tr>
              </thead>
              <tbody>
                {semiExportPurchases.slice(0, 8).map((s: any) => (
                  <tr key={s.id}>
                    <td>{new Date(s.receiveDateTime || s.createdAt).toLocaleDateString()}</td>
                    <td>{s.customerName || "—"}</td>
                    <td>
                      <span className="db-cat-badge">{s.color || "—"}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {fmt(s.totalReceiveWeight || 0)}
                    </td>
                  </tr>
                ))}
                {semiExportPurchases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-row">No semi-export purchase records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ── Sorting Summary Bar ── */}
      {totals && (
        <div className="totals-summary-bar">
          <div className="total-bar-item sorted">
            <Layers size={16} />
            <div>
              <span className="total-bar-label">Total Sorted</span>
              <span className="total-bar-val">{fmt(totals.sorted)} viss</span>
            </div>
          </div>
          <div className="total-bar-divider" />
          <div className="total-bar-item lost">
            <ArrowDownRight size={16} />
            <div>
              <span className="total-bar-label">Total Lost</span>
              <span className="total-bar-val">{fmt(totals.lost)} viss</span>
            </div>
          </div>
          <div className="total-bar-divider" />
          <div className="total-bar-item spoil">
            <Droplet size={16} />
            <div>
              <span className="total-bar-label">Total Spoilage</span>
              <span className="total-bar-val">{fmt(totals.spoilage)} viss</span>
            </div>
          </div>
          <div className="total-bar-divider" />
          <div className="total-bar-item ret">
            <RefreshCw size={16} />
            <div>
              <span className="total-bar-label">Total Returns</span>
              <span className="total-bar-val">{fmt(totals.returns)} viss</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Marker Sorting Table ── */}
      <SectionCard
        icon={<BarChart2 size={20} />}
        title="Sorting Stats by Marker"
        badge={`${(stats?.markerSortingStats ?? []).length} markers`}
        accent="#6366f1"
      >
        <div className="db-search-wrap" style={{ marginBottom: 12 }}>
          <Search size={15} className="db-search-icon" />
          <input
            className="db-search"
            placeholder="Search marker, warehouse, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="db-table-scroll">
          <table className="db-table">
            <thead>
              <tr>
                <th className="db-th db-th-sort" onClick={() => handleSort("marker")}>
                  <div className="db-th-inner">
                    <span>Marker</span>
                    <SortIcon field="marker" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th">Warehouse</th>
                <th className="db-th">Category</th>
                <th className="db-th db-th-sort db-th-num" onClick={() => handleSort("recordCount")}>
                  <div className="db-th-inner db-th-inner-right">
                    <span>Records</span>
                    <SortIcon field="recordCount" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th db-th-sort db-th-num sorted-col" onClick={() => handleSort("totalSorted")}>
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Sorted</span>
                    <SortIcon field="totalSorted" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th db-th-sort db-th-num lost-col" onClick={() => handleSort("totalLost")}>
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Lost</span>
                    <SortIcon field="totalLost" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th db-th-sort db-th-num spoil-col" onClick={() => handleSort("totalSpoilage")}>
                  <div className="db-th-inner db-th-inner-right">
                    <span>Spoilage</span>
                    <SortIcon field="totalSpoilage" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th db-th-sort db-th-num ret-col" onClick={() => handleSort("totalReturns")}>
                  <div className="db-th-inner db-th-inner-right">
                    <span>Returns</span>
                    <SortIcon field="totalReturns" current={sortField} dir={sortDir} />
                  </div>
                </th>
                <th className="db-th db-th-num">Loss %</th>
                <th className="db-th db-th-num">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="db-td-empty">
                    <Tag size={32} style={{ opacity: 0.25 }} />
                    <p>No markers found</p>
                  </td>
                </tr>
              ) : (
                filteredMarkers.map((m, idx) => {
                  const lossRate = m.totalSorted > 0 ? (m.totalLost / m.totalSorted) * 100 : 0;
                  const isHighLoss = lossRate > 5;
                  return (
                    <tr key={m.marker} className={`db-tr ${idx % 2 === 0 ? "db-tr-even" : ""}`}>
                      <td className="db-td">
                        <div className="db-marker-cell">
                          <span className="db-marker-dot" />
                          <span className="db-marker-name">{m.marker}</span>
                        </div>
                      </td>
                      <td className="db-td db-td-muted">{m.warehouseName || "—"}</td>
                      <td className="db-td">
                        {m.category ? <span className="db-cat-badge">{m.category}</span> : "—"}
                      </td>
                      <td className="db-td db-td-num">
                        <span className="db-rec-count">{m.recordCount}</span>
                      </td>
                      <td className="db-td db-td-num sorted-col">
                        <span className="db-sorted-val">
                          <ArrowUpRight size={13} />
                          {fmt(m.totalSorted)}
                        </span>
                      </td>
                      <td className="db-td db-td-num lost-col">
                        {m.totalLost > 0 ? (
                          <span className="db-lost-val">
                            <ArrowDownRight size={13} />{fmt(m.totalLost)}
                          </span>
                        ) : <span className="db-zero">—</span>}
                      </td>
                      <td className="db-td db-td-num spoil-col">
                        {m.totalSpoilage > 0
                          ? <span className="db-spoil-val">{fmt(m.totalSpoilage)}</span>
                          : <span className="db-zero">—</span>}
                      </td>
                      <td className="db-td db-td-num ret-col">
                        {m.totalReturns > 0
                          ? <span className="db-ret-val">{fmt(m.totalReturns)}</span>
                          : <span className="db-zero">—</span>}
                      </td>
                      <td className="db-td db-td-num">
                        <div className="db-loss-bar-wrap">
                          <div
                            className={`db-loss-bar ${isHighLoss ? "db-loss-bar-high" : ""}`}
                            style={{ width: `${Math.min(lossRate * 4, 100)}%` }}
                          />
                          <span className={`db-loss-pct ${isHighLoss ? "db-loss-pct-high" : ""}`}>
                            {lossRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="db-td db-td-num">
                        <button
                          className="detail-btn"
                          onClick={() => handleViewDetails(m.marker)}
                        >
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Recent Sales ── */}
      {(stats?.recentSales ?? []).length > 0 && (
        <SectionCard
          icon={<ShoppingCart size={18} />}
          title="Recent Sales"
          badge="Latest 10"
          accent="#10b981"
        >
          <div className="db-table-scroll">
            <table className="db-table">
              <thead>
                <tr>
                  <th className="db-th">Date</th>
                  <th className="db-th">Product</th>
                  <th className="db-th">Marker</th>
                  <th className="db-th db-th-num">Weight</th>
                  <th className="db-th db-th-num">Price</th>
                  <th className="db-th db-th-num">Amount</th>
                  <th className="db-th">Category</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentSales ?? []).map((s: any, idx: number) => (
                  <tr key={s.id} className={`db-tr ${idx % 2 === 0 ? "db-tr-even" : ""}`}>
                    <td className="db-td db-td-muted">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="db-td">
                      <span className="db-marker-name">{s.productMarker || "—"}</span>
                    </td>
                    <td className="db-td db-td-muted">{s.marker || "—"}</td>
                    <td className="db-td db-td-num">{fmt(s.weight || 0)} {s.unit}</td>
                    <td className="db-td db-td-num">
                      {(s.price || 0).toLocaleString()} {s.currency}
                    </td>
                    <td className="db-td db-td-num" style={{ fontWeight: 700 }}>
                      {((s.weight || 0) * (s.price || 0)).toLocaleString()}
                    </td>
                    <td className="db-td">
                      {s.category ? <span className="db-cat-badge">{s.category}</span> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Marker Details Modal ── */}
      {selectedMarkerName && (
        <Modal
          isOpen={!!selectedMarkerName}
          onClose={() => { setSelectedMarkerName(null); setDetailsData(null); }}
          title={`Marker Analysis: ${selectedMarkerName}`}
          maxWidth="90%"
        >
          {detailsLoading ? (
            <div className="db-loading" style={{ height: "400px" }}>
              <div className="db-pulse-ring" />
              <p>Aggregating marker records...</p>
            </div>
          ) : detailsData ? (
            <div className="marker-details-container">
              {/* Top Summary Widgets */}
              <div className="marker-details-header-stats">
                <div className="details-kpi-card bg-inventory">
                  <div className="details-kpi-icon"><Scale size={18} /></div>
                  <div className="details-kpi-body">
                    <span className="details-kpi-title">Inventory Weight</span>
                    <h4 className="details-kpi-value">
                      {fmt(detailsData.metrics.originalWeightViss)} <span className="kpi-unit">viss</span>
                    </h4>
                    <span className="details-kpi-footer">({fmt(detailsData.metrics.originalWeightKg)} kg)</span>
                  </div>
                </div>
                <div className="details-kpi-card bg-sales">
                  <div className="details-kpi-icon"><TrendingUp size={18} /></div>
                  <div className="details-kpi-body">
                    <span className="details-kpi-title">Weight Sold</span>
                    <h4 className="details-kpi-value">
                      {fmt(detailsData.metrics.soldWeightViss)} <span className="kpi-unit">viss</span>
                    </h4>
                    <span className="details-kpi-footer">({fmt(detailsData.metrics.soldWeightKg)} kg)</span>
                  </div>
                </div>
                <div className="details-kpi-card bg-washed">
                  <div className="details-kpi-icon"><Droplet size={18} /></div>
                  <div className="details-kpi-body">
                    <span className="details-kpi-title">Washed Weight</span>
                    <h4 className="details-kpi-value">
                      {fmt(detailsData.metrics.washWashedStock)} <span className="kpi-unit">viss</span>
                    </h4>
                    <span className="details-kpi-footer">({fmt(detailsData.metrics.washWeight)} viss raw)</span>
                  </div>
                </div>
                <div className="details-kpi-card bg-sorted">
                  <div className="details-kpi-icon"><Layers size={18} /></div>
                  <div className="details-kpi-body">
                    <span className="details-kpi-title">Sorted Weight</span>
                    <h4 className="details-kpi-value">
                      {fmt(detailsData.metrics.totalSortedWeight)} <span className="kpi-unit">viss</span>
                    </h4>
                    <span className="details-kpi-footer">({detailsData.sdd.length} SDD batches)</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="details-tabs">
                <button className={`details-tab-btn ${detailsTab === "inventory" ? "active" : ""}`} onClick={() => setDetailsTab("inventory")}>
                  <Compass size={16} /> Inventory & Sales
                </button>
                <button className={`details-tab-btn ${detailsTab === "pre-processing" ? "active" : ""}`} onClick={() => setDetailsTab("pre-processing")}>
                  <Palette size={16} /> Wash & Mess Labour
                </button>
                <button className={`details-tab-btn ${detailsTab === "processing" ? "active" : ""}`} onClick={() => setDetailsTab("processing")}>
                  <Users size={16} /> Purify & Refine
                </button>
                <button className={`details-tab-btn ${detailsTab === "sorting" ? "active" : ""}`} onClick={() => setDetailsTab("sorting")}>
                  <FileText size={16} /> Final Sorting & Fees
                </button>
              </div>

              {/* Tab Contents */}
              <div className="details-tab-content">
                {detailsTab === "inventory" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Inventory Registration</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Date</th><th>Warehouse</th><th>Original Weight</th><th>Register Price</th><th>Remaining Stock</th></tr>
                            </thead>
                            <tbody>
                              {detailsData.products.map((p: any) => (
                                <tr key={p.id}>
                                  <td>{new Date(p.date).toLocaleDateString()}</td>
                                  <td>{p.warehouseName || "—"}</td>
                                  <td>{p.weight} {p.unit}</td>
                                  <td>{p.price.toLocaleString()} {p.currency}</td>
                                  <td>{p.remainingWeight} {p.unit}</td>
                                </tr>
                              ))}
                              {detailsData.products.length === 0 && (
                                <tr><td colSpan={5} className="empty-row">No inventory records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="details-section-box">
                        <h3 className="section-box-title">Raw Material Sales</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Date</th><th>Customer</th><th>Weight</th><th>Price</th><th>Total Revenue</th></tr>
                            </thead>
                            <tbody>
                              {detailsData.sales.map((s: any) => (
                                <tr key={s.id}>
                                  <td>{new Date(s.date).toLocaleDateString()}</td>
                                  <td>{s.customerName || "—"}</td>
                                  <td>{s.weight} {s.unit}</td>
                                  <td>{s.price.toLocaleString()} {s.currency}</td>
                                  <td>{(s.weight * s.price).toLocaleString()} {s.currency}</td>
                                </tr>
                              ))}
                              {detailsData.sales.length === 0 && (
                                <tr><td colSpan={5} className="empty-row">No sales records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === "pre-processing" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Wash & Grading Operations</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Date</th><th>Worker</th><th>Wash Weight</th><th>Lost Weight</th><th>Washed Stock</th><th>Worker Fees</th></tr>
                            </thead>
                            <tbody>
                              {detailsData.washGrading.map((wg: any) => (
                                <tr key={wg.id}>
                                  <td>{new Date(wg.date).toLocaleDateString()}</td>
                                  <td>{wg.washGradingWorkerName || "—"}</td>
                                  <td>{wg.weight} viss</td>
                                  <td>{wg.lostWeight} viss</td>
                                  <td>{(wg.weight - wg.lostWeight).toFixed(3)} viss</td>
                                  <td>{wg.workerFees?.toLocaleString() || 0} MMK</td>
                                </tr>
                              ))}
                              {detailsData.washGrading.length === 0 && (
                                <tr><td colSpan={6} className="empty-row">No washing records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="details-section-box">
                        <h3 className="section-box-title">Mess Labour Colors & Counts</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Color</th><th style={{ textAlign: "right" }}>Total Count</th><th style={{ textAlign: "right" }}>Total Weight (viss)</th></tr>
                            </thead>
                            <tbody>
                              {Object.keys(detailsData.metrics.mlColors).map((colorName: string) => (
                                <tr key={colorName}>
                                  <td style={{ fontWeight: 700 }}>{colorName}</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.mlColors[colorName].count.toLocaleString()}</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.mlColors[colorName].weight.toFixed(3)} viss</td>
                                </tr>
                              ))}
                              {Object.keys(detailsData.metrics.mlColors).length === 0 && (
                                <tr><td colSpan={3} className="empty-row">No color breakdown records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="ml-summary-stats">
                          <span><strong>Mess Labour Loss:</strong> {detailsData.metrics.mlLostWeight.toFixed(3)} viss</span>
                          <span><strong>Mess Labour Fees:</strong> {detailsData.metrics.mlWorkerFees.toLocaleString()} MMK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === "processing" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Purification Details</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Date</th><th>Category</th><th>Place</th><th>Purified Count / Weight</th><th>Supervisor / Worker Fees</th></tr>
                            </thead>
                            <tbody>
                              {detailsData.purification.map((pu: any) => (
                                <tr key={pu.id}>
                                  <td>{new Date(pu.date).toLocaleDateString()}</td>
                                  <td><span className="db-cat-badge">{pu.category}</span></td>
                                  <td>{pu.placeName || "—"}</td>
                                  <td>{pu.count.toLocaleString()} pcs / {pu.weight.toFixed(3)} viss</td>
                                  <td>{(pu.supervisorFees || 0).toLocaleString()} / {(pu.workerFees || 0).toLocaleString()} MMK</td>
                                </tr>
                              ))}
                              {detailsData.purification.length === 0 && (
                                <tr><td colSpan={5} className="empty-row">No purification records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="details-section-box">
                        <h3 className="section-box-title">Girdle-bush Refinement Details</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr><th>Date</th><th>Category</th><th>Worker</th><th>Refined Weight</th><th>Lost / Spoilage / Return</th><th>Worker Fees</th></tr>
                            </thead>
                            <tbody>
                              {detailsData.refinement.map((r: any) => (
                                <tr key={r.id}>
                                  <td>{new Date(r.date).toLocaleDateString()}</td>
                                  <td><span className="db-cat-badge">{r.category}</span></td>
                                  <td>{r.refinementWorkerName || "—"}</td>
                                  <td>{r.weight.toFixed(3)} viss</td>
                                  <td>
                                    <span style={{ color: "#ef4444" }}>L: {r.lostWeight}</span> |{" "}
                                    <span style={{ color: "#f59e0b" }}>S: {r.spoilageWeight}</span> |{" "}
                                    <span style={{ color: "#10b981" }}>R: {r.returnWeight}</span>
                                  </td>
                                  <td>{r.workerFees?.toLocaleString() || 0} MMK</td>
                                </tr>
                              ))}
                              {detailsData.refinement.length === 0 && (
                                <tr><td colSpan={6} className="empty-row">No refinement records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === "sorting" && (
                  <div className="details-pane">
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div className="details-section-box">
                        <h3 className="section-box-title">Single & Double Drawn Sorted Sizes (viss)</h3>
                        <div className="sdd-sizes-grid">
                          {Object.keys(detailsData.metrics.sddSizes).map((sizeKey: string) => (
                            <div className="sdd-size-cell" key={sizeKey}>
                              <span className="sdd-size-label">{sizeKey.replace("Size ", "")}</span>
                              <span className="sdd-size-val">{detailsData.metrics.sddSizes[sizeKey].toFixed(3)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="sdd-summary-row">
                          <span><strong>SDD Total Sorted Weight:</strong> {detailsData.metrics.totalSortedWeight.toFixed(3)} viss</span>
                          <span><strong>SDD Worker Fees:</strong> {detailsData.metrics.sddWorkerFees.toLocaleString()} MMK</span>
                        </div>
                      </div>
                      <div className="details-section-grid">
                        <div className="details-section-box">
                          <h3 className="section-box-title">Sorted Batches Logs</h3>
                          <div className="details-table-wrapper">
                            <table className="details-inner-table">
                              <thead>
                                <tr><th>Date</th><th>Worker</th><th>Note</th><th>Worker Fees</th></tr>
                              </thead>
                              <tbody>
                                {detailsData.sdd.map((s: any) => (
                                  <tr key={s.id}>
                                    <td>{new Date(s.date).toLocaleDateString()}</td>
                                    <td>{s.workerName || "—"}</td>
                                    <td>{s.note || "—"}</td>
                                    <td>{s.workerFees?.toLocaleString() || 0} MMK</td>
                                  </tr>
                                ))}
                                {detailsData.sdd.length === 0 && (
                                  <tr><td colSpan={4} className="empty-row">No sorted records found.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="details-section-box">
                          <h3 className="section-box-title">Total Worker Fees Summary (All Process)</h3>
                          <div className="details-table-wrapper">
                            <table className="details-inner-table">
                              <thead>
                                <tr><th>Process Step</th><th style={{ textAlign: "right" }}>Total Fees (MMK)</th></tr>
                              </thead>
                              <tbody>
                                <tr><td>Wash & Grading Worker Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.washWorkerFees.toLocaleString()} MMK</td></tr>
                                <tr><td>Mess Labour Worker Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.mlWorkerFees.toLocaleString()} MMK</td></tr>
                                <tr><td>Purification Supervisor Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.purifySupervisorFees.toLocaleString()} MMK</td></tr>
                                <tr><td>Purification Purifier Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.purifyWorkerFees.toLocaleString()} MMK</td></tr>
                                <tr><td>Girdle-bush Refinement Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.refineWorkerFees.toLocaleString()} MMK</td></tr>
                                <tr><td>Single & Double Drawn Worker Fees</td><td style={{ textAlign: "right" }}>{detailsData.metrics.sddWorkerFees.toLocaleString()} MMK</td></tr>
                                <tr style={{ background: "#eff6ff", fontWeight: 800, fontSize: 15, color: "#1e40af" }}>
                                  <td>GRAND TOTAL WORKER FEES</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.grandTotalFees.toLocaleString()} MMK</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
