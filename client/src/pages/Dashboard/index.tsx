import React, { useEffect, useState, useMemo } from "react";
import {
  dashboardAPI,
  productsAPI,
  salesAPI,
  washGradingAPI,
  processingAPI,
  purificationAPI,
  refinementAPI,
  singleDoubleDrawnAPI
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
  FileText
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
// const fmtInt = (n: number) => n.toLocaleString();

// const KpiCard: React.FC<{
//   title: string;
//   value: string;
//   sub?: string;
//   icon: React.ReactNode;
//   gradient: string;
//   glow: string;
//   delay?: string;
// }> = ({ title, value, sub, icon, gradient, glow, delay = "0s" }) => (
//   <div className="db-kpi-card" style={{ animationDelay: delay }}>
//     <div
//       className="db-kpi-icon"
//       style={{ background: gradient, boxShadow: glow }}
//     >
//       {icon}
//     </div>
//     <div className="db-kpi-body">
//       <p className="db-kpi-title">{title}</p>
//       <h3 className="db-kpi-value">{value}</h3>
//       {sub && <p className="db-kpi-sub">{sub}</p>}
//     </div>
//     <div className="db-kpi-shimmer" />
//   </div>
// );

const SortIcon: React.FC<{
  field: SortField;
  current: SortField;
  dir: SortDir;
}> = ({ field, current, dir }) => {
  if (field !== current) return <Minus size={12} style={{ opacity: 0.3 }} />;
  return dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalSorted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selectedMarkerName, setSelectedMarkerName] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [detailsTab, setDetailsTab] = useState("inventory");

  const handleViewDetails = async (markerName: string) => {
    setSelectedMarkerName(markerName);
    setDetailsLoading(true);
    setDetailsTab("inventory");
    try {
      const [
        productsList,
        salesList,
        washGradingList,
        processingList,
        purificationList,
        refinementList,
        sddList
      ] = await Promise.all([
        productsAPI.getAll(true),
        salesAPI.getAll("Sales"),
        washGradingAPI.getRecords(),
        processingAPI.getAll(),
        purificationAPI.getPurifiedRecords(),
        refinementAPI.getRefinementRecords(),
        singleDoubleDrawnAPI.getAll()
      ]);

      const markerLower = markerName.toLowerCase();
      
      const filteredProducts = productsList.filter(p => p.marker && p.marker.toLowerCase() === markerLower);
      const filteredSales = salesList.filter(s => (s.productMarker && s.productMarker.toLowerCase() === markerLower) || (s.marker && s.marker.toLowerCase() === markerLower));
      const filteredWashGrading = washGradingList.filter(wg => wg.productMarker && wg.productMarker.toLowerCase() === markerLower);
      const filteredProcessing = processingList.filter(p => p.productMarker && p.productMarker.toLowerCase() === markerLower);
      const filteredPurification = purificationList.filter(pu => pu.productMarker && pu.productMarker.toLowerCase() === markerLower);
      const filteredRefinement = refinementList.filter(r => r.productMarker && r.productMarker.toLowerCase() === markerLower);
      const filteredSdd = sddList.filter(sdd => sdd.refinementRecordMarker && sdd.refinementRecordMarker.toLowerCase() === markerLower);

      let originalWeightKg = 0;
      let originalWeightViss = 0;
      let remainingWeightKg = 0;
      let remainingWeightViss = 0;
      let totalPrice = 0;
      let currency = "MMK";
      let unit = "kg";
      let warehouseNamesSet = new Set<string>();

      if (filteredProducts.length > 0) {
        filteredProducts.forEach(p => {
          const w = p.weight || 0;
          const rem = p.remainingWeight || 0;
          if (p.unit === "kg") {
            originalWeightKg += w;
            originalWeightViss += w / 1.633;
            remainingWeightKg += rem;
            remainingWeightViss += rem / 1.633;
          } else {
            originalWeightViss += w;
            originalWeightKg += w * 1.633;
            remainingWeightViss += rem;
            remainingWeightKg += rem * 1.633;
          }
          totalPrice += p.price || 0;
          currency = p.currency || "MMK";
          unit = p.unit || "kg";
          if (p.warehouseName) warehouseNamesSet.add(p.warehouseName);
        });
      }

      let soldWeightKg = 0;
      let soldWeightViss = 0;
      let totalSalesAmount = 0;
      filteredSales.forEach(s => {
        const w = s.weight || 0;
        if (s.unit === "kg") {
          soldWeightKg += w;
          soldWeightViss += w / 1.633;
        } else {
          soldWeightViss += w;
          soldWeightKg += w * 1.633;
        }
        totalSalesAmount += (w * s.price) || 0;
      });

      let washWeight = 0;
      let washLostWeight = 0;
      let washWashedStock = 0;
      let washWorkerFees = 0;
      filteredWashGrading.forEach(wg => {
        washWeight += wg.weight || 0;
        washLostWeight += wg.lostWeight || 0;
        washWashedStock += wg.remainingWeight || 0;
        washWorkerFees += wg.workerFees || 0;
      });

      let mlLostWeight = 0;
      let mlWorkerFees = 0;
      let mlColors: Record<string, { weight: number, count: number }> = {};
      
      const initializeColor = (colName: string) => {
        if (!mlColors[colName]) {
          mlColors[colName] = { weight: 0, count: 0 };
        }
      };

      filteredProcessing.forEach(p => {
        mlLostWeight += p.lossWeight || 0;
        mlWorkerFees += p.workerFees || 0;
        
        if (p.redWeight || p.redCount) {
          initializeColor("Red");
          mlColors["Red"].weight += p.redWeight || 0;
          mlColors["Red"].count += p.redCount || 0;
        }
        if (p.whiteWeight || p.whiteCount) {
          initializeColor("White");
          mlColors["White"].weight += p.whiteWeight || 0;
          mlColors["White"].count += p.whiteCount || 0;
        }
        if (p.specialWeight || p.specialCount) {
          initializeColor("Special");
          mlColors["Special"].weight += p.specialWeight || 0;
          mlColors["Special"].count += p.specialCount || 0;
        }
        if (p.naturalWeight || p.naturalCount) {
          initializeColor("Natural");
          mlColors["Natural"].weight += p.naturalWeight || 0;
          mlColors["Natural"].count += p.naturalCount || 0;
        }
        if (p.naturalWhiteWeight || p.naturalWhiteCount) {
          initializeColor("Natural White");
          mlColors["Natural White"].weight += p.naturalWhiteWeight || 0;
          mlColors["Natural White"].count += p.naturalWhiteCount || 0;
        }
        if (p.naturalRedWeight || p.naturalRedCount) {
          initializeColor("Natural Red");
          mlColors["Natural Red"].weight += p.naturalRedWeight || 0;
          mlColors["Natural Red"].count += p.naturalRedCount || 0;
        }
        if (p.shortCutWeight || p.shortCutCount) {
          initializeColor("Short Cut");
          mlColors["Short Cut"].weight += p.shortCutWeight || 0;
          mlColors["Short Cut"].count += p.shortCutCount || 0;
        }
        if (p.artificialWeight || p.artificialCount) {
          initializeColor("Artificial");
          mlColors["Artificial"].weight += p.artificialWeight || 0;
          mlColors["Artificial"].count += p.artificialCount || 0;
        }
        if (p.shortWeight || p.shortCount) {
          initializeColor("Short");
          mlColors["Short"].weight += p.shortWeight || 0;
          mlColors["Short"].count += p.shortCount || 0;
        }
      });

      let purifyWeight = 0;
      let purifyCount = 0;
      let purifyWorkerFees = 0;
      let purifySupervisorFees = 0;
      filteredPurification.forEach(pu => {
        purifyWeight += pu.weight || 0;
        purifyCount += pu.count || 0;
        purifyWorkerFees += pu.workerFees || 0;
        purifySupervisorFees += pu.supervisorFees || 0;
      });

      let refineWeight = 0;
      let refineCount = 0;
      let refineLostWeight = 0;
      let refineSpoilageWeight = 0;
      let refineReturnWeight = 0;
      let refineWorkerFees = 0;
      filteredRefinement.forEach(r => {
        refineWeight += r.weight || 0;
        refineCount += r.count || 0;
        refineLostWeight += r.lostWeight || 0;
        refineSpoilageWeight += r.spoilageWeight || 0;
        refineReturnWeight += r.returnWeight || 0;
        refineWorkerFees += r.workerFees || 0;
      });

      let sddWorkerFees = 0;
      let sddLostWeight = 0;
      let sddSpoilageWeight = 0;
      let sddReturnWeight = 0;
      let sddSingleDoubleLostWeight = 0;
      
      let sddSizes: Record<string, number> = {
        "Size 6": 0, "Size 7": 0, "Size 8": 0, "Size 9": 0, "Size 10": 0, "Size 10B": 0,
        "Size 12": 0, "Size 14": 0, "Size 16": 0, "Size 18": 0, "Size 20": 0, "Size 22": 0,
        "Size 24": 0, "Size 26": 0, "Size 28": 0, "Size Bar": 0
      };

      filteredSdd.forEach(s => {
        sddWorkerFees += s.workerFees || 0;
        sddLostWeight += s.lostWeight || 0;
        sddSpoilageWeight += s.spoilageWeight || 0;
        sddReturnWeight += s.returnWeight || 0;
        sddSingleDoubleLostWeight += s.singleDoubleLostWeight || 0;

        sddSizes["Size 6"] += s.size6 || 0;
        sddSizes["Size 7"] += s.size7 || 0;
        sddSizes["Size 8"] += s.size8 || 0;
        sddSizes["Size 9"] += s.size9 || 0;
        sddSizes["Size 10"] += s.size10 || 0;
        sddSizes["Size 10B"] += s.size10B || 0;
        sddSizes["Size 12"] += s.size12 || 0;
        sddSizes["Size 14"] += s.size14 || 0;
        sddSizes["Size 16"] += s.size16 || 0;
        sddSizes["Size 18"] += s.size18 || 0;
        sddSizes["Size 20"] += s.size20 || 0;
        sddSizes["Size 22"] += s.size22 || 0;
        sddSizes["Size 24"] += s.size24 || 0;
        sddSizes["Size 26"] += s.size26 || 0;
        sddSizes["Size 28"] += s.size28 || 0;
        sddSizes["Size Bar"] += s.sizeBar || 0;
      });

      const totalSortedWeight = Object.values(sddSizes).reduce((a, b) => a + b, 0);

      const grandTotalFees = washWorkerFees + mlWorkerFees + purifyWorkerFees + purifySupervisorFees + refineWorkerFees + sddWorkerFees;

      setDetailsData({
        products: filteredProducts,
        sales: filteredSales,
        washGrading: filteredWashGrading,
        processing: filteredProcessing,
        purification: filteredPurification,
        refinement: filteredRefinement,
        sdd: filteredSdd,
        metrics: {
          originalWeightKg,
          originalWeightViss,
          remainingWeightKg,
          remainingWeightViss,
          price: filteredProducts.length > 0 ? filteredProducts[0].price : 0,
          currency,
          unit,
          warehouseNames: Array.from(warehouseNamesSet).join(", ") || "No Warehouse",
          soldWeightKg,
          soldWeightViss,
          totalSalesAmount,
          washWeight,
          washLostWeight,
          washWashedStock,
          washWorkerFees,
          mlLostWeight,
          mlWorkerFees,
          mlColors,
          purifyWeight,
          purifyCount,
          purifyWorkerFees,
          purifySupervisorFees,
          refineWeight,
          refineCount,
          refineLostWeight,
          refineSpoilageWeight,
          refineReturnWeight,
          refineWorkerFees,
          sddWorkerFees,
          sddLostWeight,
          sddSpoilageWeight,
          sddReturnWeight,
          sddSingleDoubleLostWeight,
          sddSizes,
          totalSortedWeight,
          grandTotalFees
        }
      });

    } catch (e) {
      console.error("Error loading marker details:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
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
          m.category.toLowerCase().includes(q),
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
    if (arr.length === 0) return null;
    return arr.reduce(
      (acc, m) => ({
        sorted: acc.sorted + m.totalSorted,
        lost: acc.lost + m.totalLost,
        spoilage: acc.spoilage + m.totalSpoilage,
        returns: acc.returns + m.totalReturns,
      }),
      { sorted: 0, lost: 0, spoilage: 0, returns: 0 },
    );
  }, [stats]);

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

  return (
    <div className="db-root fade-in">
      
      {/* <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">
            Overview of operations &amp; sorting metrics
          </p>
        </div>
        <div className="db-live-badge">
          <span className="db-live-dot" />
          Live Data
        </div>
      </div>

      
      <div className="db-kpi-grid">
        <KpiCard
          delay="0s"
          title="Total Products"
          value={fmtInt(stats?.totalProducts || 0)}
          sub={`${stats?.activeProducts || 0} active`}
          icon={<Package size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#6366f1,#4f46e5)"
          glow="0 8px 24px rgba(99,102,241,0.4)"
        />
        <KpiCard
          delay="0.07s"
          title="Total Inventory"
          value={`${fmt(stats?.totalInventoryWeight || 0)}`}
          sub="kg on hand"
          icon={<Scale size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#0ea5e9,#0284c7)"
          glow="0 8px 24px rgba(14,165,233,0.4)"
        />
        <KpiCard
          delay="0.14s"
          title="Total Sales"
          value={fmtInt(stats?.totalSales || 0)}
          sub="all time"
          icon={<ShoppingCart size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#10b981,#059669)"
          glow="0 8px 24px rgba(16,185,129,0.4)"
        />
        <KpiCard
          delay="0.21s"
          title="Today's Sales"
          value={fmtInt(stats?.todaySales || 0)}
          sub={`${(stats?.todaySalesAmount || 0).toLocaleString()} MMK`}
          icon={<TrendingUp size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
          glow="0 8px 24px rgba(245,158,11,0.4)"
        />
        <KpiCard
          delay="0.28s"
          title="Total Sorted"
          value={totals ? `${fmt(totals.sorted)} viss` : "—"}
          sub={`${(stats?.markerSortingStats ?? []).length} markers`}
          icon={<Layers size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)"
          glow="0 8px 24px rgba(139,92,246,0.4)"
        />
        <KpiCard
          delay="0.35s"
          title="Total Lost"
          value={totals ? `${fmt(totals.lost)} viss` : "—"}
          sub="across all markers"
          icon={<AlertTriangle size={26} color="#fff" />}
          gradient="linear-gradient(135deg,#ef4444,#dc2626)"
          glow="0 8px 24px rgba(239,68,68,0.4)"
        />
      </div> */}

      {/* Per-Marker Stats Table */}
      <div className="db-section-card">
        <div className="db-section-header">
          <div className="db-section-title-wrap">
            <BarChart2 size={22} className="db-section-icon" />
            <h2 className="db-section-title">Sorting Stats by Marker</h2>
            <span className="db-badge">
              {(stats?.markerSortingStats ?? []).length} markers
            </span>
          </div>
          <div className="db-search-wrap">
            <Search size={16} className="db-search-icon" />
            <input
              className="db-search"
              placeholder="Search marker, warehouse…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Summary bar */}
        {totals && (
          <div className="db-summary-bar">
            <div className="db-summary-item db-summary-sorted">
              <span className="db-summary-label">Total Sorted</span>
              <span className="db-summary-value">
                {fmt(totals.sorted)} viss
              </span>
            </div>
            <div className="db-summary-divider" />
            <div className="db-summary-item db-summary-lost">
              <span className="db-summary-label">Total Lost</span>
              <span className="db-summary-value">{fmt(totals.lost)} viss</span>
            </div>
            <div className="db-summary-divider" />
            <div className="db-summary-item db-summary-spoilage">
              <span className="db-summary-label">Total Spoilage</span>
              <span className="db-summary-value">
                {fmt(totals.spoilage)} viss
              </span>
            </div>
            <div className="db-summary-divider" />
            <div className="db-summary-item db-summary-returns">
              <span className="db-summary-label">Total Returns</span>
              <span className="db-summary-value">
                {fmt(totals.returns)} viss
              </span>
            </div>
          </div>
        )}

        <div className="db-table-scroll">
          <table className="db-table">
            <thead>
              <tr>
                <th
                  className="db-th db-th-sort"
                  onClick={() => handleSort("marker")}
                >
                  <div className="db-th-inner">
                    <span>Marker</span>
                    <SortIcon
                      field="marker"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th className="db-th">Warehouse</th>
                <th className="db-th">Category</th>
                <th
                  className="db-th db-th-sort db-th-num"
                  onClick={() => handleSort("recordCount")}
                >
                  <div className="db-th-inner db-th-inner-right">
                    <span>Records</span>
                    <SortIcon
                      field="recordCount"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th
                  className="db-th db-th-sort db-th-num sorted-col"
                  onClick={() => handleSort("totalSorted")}
                >
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Sorted</span>
                    <SortIcon
                      field="totalSorted"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th
                  className="db-th db-th-sort db-th-num lost-col"
                  onClick={() => handleSort("totalLost")}
                >
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Lost</span>
                    <SortIcon
                      field="totalLost"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th
                  className="db-th db-th-sort db-th-num spoil-col"
                  onClick={() => handleSort("totalSpoilage")}
                >
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Spoilage</span>
                    <SortIcon
                      field="totalSpoilage"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th
                  className="db-th db-th-sort db-th-num ret-col"
                  onClick={() => handleSort("totalReturns")}
                >
                  <div className="db-th-inner db-th-inner-right">
                    <span>Total Returns</span>
                    <SortIcon
                      field="totalReturns"
                      current={sortField}
                      dir={sortDir}
                    />
                  </div>
                </th>
                <th className="db-th db-th-num">Loss %</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="db-td-empty">
                    <Tag size={32} style={{ opacity: 0.25 }} />
                    <p>No markers found</p>
                  </td>
                </tr>
              ) : (
                filteredMarkers.map((m, idx) => {
                  const lossRate =
                    m.totalSorted > 0 ? (m.totalLost / m.totalSorted) * 100 : 0;
                  const isHighLoss = lossRate > 5;
                  return (
                    <tr
                      key={m.marker}
                      className={`db-tr ${idx % 2 === 0 ? "db-tr-even" : ""}`}
                    >
                      <td className="db-td">
                        <div
                          className="db-marker-cell clickable-marker"
                          onClick={() => handleViewDetails(m.marker)}
                          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        >
                          <span className="db-marker-dot" />
                          <span className="db-marker-name" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "underline" }}>
                            {m.marker}
                          </span>
                          <BarChart2 size={13} style={{ marginLeft: "6px", color: "#6366f1" }} />
                        </div>
                      </td>
                      <td className="db-td db-td-muted">
                        {m.warehouseName || "—"}
                      </td>
                      <td className="db-td">
                        {m.category ? (
                          <span className="db-cat-badge">{m.category}</span>
                        ) : (
                          "—"
                        )}
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
                            <ArrowDownRight size={13} />
                            {fmt(m.totalLost)}
                          </span>
                        ) : (
                          <span className="db-zero">—</span>
                        )}
                      </td>
                      <td className="db-td db-td-num spoil-col">
                        {m.totalSpoilage > 0 ? (
                          <span className="db-spoil-val">
                            {fmt(m.totalSpoilage)}
                          </span>
                        ) : (
                          <span className="db-zero">—</span>
                        )}
                      </td>
                      <td className="db-td db-td-num ret-col">
                        {m.totalReturns > 0 ? (
                          <span className="db-ret-val">
                            {fmt(m.totalReturns)}
                          </span>
                        ) : (
                          <span className="db-zero">—</span>
                        )}
                      </td>
                      <td className="db-td db-td-num">
                        <div className="db-loss-bar-wrap">
                          <div
                            className={`db-loss-bar ${isHighLoss ? "db-loss-bar-high" : ""}`}
                            style={{ width: `${Math.min(lossRate * 4, 100)}%` }}
                          />
                          <span
                            className={`db-loss-pct ${isHighLoss ? "db-loss-pct-high" : ""}`}
                          >
                            {lossRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedMarkerName && (
        <Modal
          isOpen={!!selectedMarkerName}
          onClose={() => {
            setSelectedMarkerName(null);
            setDetailsData(null);
          }}
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
                <button
                  className={`details-tab-btn ${detailsTab === "inventory" ? "active" : ""}`}
                  onClick={() => setDetailsTab("inventory")}
                >
                  <Compass size={16} /> Inventory &amp; Sales
                </button>
                <button
                  className={`details-tab-btn ${detailsTab === "pre-processing" ? "active" : ""}`}
                  onClick={() => setDetailsTab("pre-processing")}
                >
                  <Palette size={16} /> Wash &amp; Mess Labour
                </button>
                <button
                  className={`details-tab-btn ${detailsTab === "processing" ? "active" : ""}`}
                  onClick={() => setDetailsTab("processing")}
                >
                  <Users size={16} /> Purify &amp; Refine
                </button>
                <button
                  className={`details-tab-btn ${detailsTab === "sorting" ? "active" : ""}`}
                  onClick={() => setDetailsTab("sorting")}
                >
                  <FileText size={16} /> Final Sorting &amp; Fees
                </button>
              </div>

              {/* Tab Contents */}
              <div className="details-tab-content">
                {/* 1. Inventory & Sales */}
                {detailsTab === "inventory" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Inventory Registration</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Warehouse</th>
                                <th>Original Weight</th>
                                <th>Register Price</th>
                                <th>Remaining Stock</th>
                              </tr>
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
                                <tr>
                                  <td colSpan={5} className="empty-row">No inventory registration records found.</td>
                                </tr>
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
                              <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Weight</th>
                                <th>Price</th>
                                <th>Total Revenue</th>
                              </tr>
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
                                <tr>
                                  <td colSpan={5} className="empty-row">No raw material sales records found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Pre-Processing */}
                {detailsTab === "pre-processing" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Wash &amp; Grading Operations</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Worker</th>
                                <th>Wash Weight</th>
                                <th>Lost Weight</th>
                                <th>Washed Stock</th>
                                <th>Worker Fees</th>
                              </tr>
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
                                <tr>
                                  <td colSpan={6} className="empty-row">No washing records found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="details-section-box">
                        <h3 className="section-box-title">Mess Labour Colors &amp; Counts Breakdown</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr>
                                <th>Color</th>
                                <th style={{ textAlign: "right" }}>Total Count (strands)</th>
                                <th style={{ textAlign: "right" }}>Total Weight (viss)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(detailsData.metrics.mlColors).map((colorName: string) => (
                                <tr key={colorName}>
                                  <td style={{ fontWeight: "700" }}>{colorName}</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.mlColors[colorName].count.toLocaleString()}</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.mlColors[colorName].weight.toFixed(3)} viss</td>
                                </tr>
                              ))}
                              {Object.keys(detailsData.metrics.mlColors).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="empty-row">No color breakdown records found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="ml-summary-stats" style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                          <span><strong>Mess Labour Loss:</strong> {detailsData.metrics.mlLostWeight.toFixed(3)} viss</span>
                          <span><strong>Mess Labour Fees:</strong> {detailsData.metrics.mlWorkerFees.toLocaleString()} MMK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Purification & Refinement */}
                {detailsTab === "processing" && (
                  <div className="details-pane">
                    <div className="details-section-grid">
                      <div className="details-section-box">
                        <h3 className="section-box-title">Purification Details</h3>
                        <div className="details-table-wrapper">
                          <table className="details-inner-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Place</th>
                                <th>Purified Count / Weight</th>
                                <th>Supervisor / Worker Fees</th>
                              </tr>
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
                                <tr>
                                  <td colSpan={5} className="empty-row">No purification records found.</td>
                                </tr>
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
                              <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Worker</th>
                                <th>Refined Weight</th>
                                <th>Lost / Spoilage / Return</th>
                                <th>Worker Fees</th>
                              </tr>
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
                                <tr>
                                  <td colSpan={6} className="empty-row">No refinement records found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Final Sorting & Fees Summary */}
                {detailsTab === "sorting" && (
                  <div className="details-pane">
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      {/* Sizing Grid Card */}
                      <div className="details-section-box">
                        <h3 className="section-box-title">Single &amp; Double Drawn Sorted Sizes (viss)</h3>
                        <div className="sdd-sizes-grid">
                          {Object.keys(detailsData.metrics.sddSizes).map((sizeKey: string) => (
                            <div className="sdd-size-cell" key={sizeKey}>
                              <span className="sdd-size-label">{sizeKey.replace("Size ", "")}</span>
                              <span className="sdd-size-val">{detailsData.metrics.sddSizes[sizeKey].toFixed(3)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="sdd-summary-row" style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                          <span><strong>SDD Total Sorted Weight:</strong> {detailsData.metrics.totalSortedWeight.toFixed(3)} viss</span>
                          <span><strong>SDD Worker Fees:</strong> {detailsData.metrics.sddWorkerFees.toLocaleString()} MMK</span>
                        </div>
                      </div>

                      <div className="details-section-grid">
                        
                        {/* SDD Records Table */}
                        <div className="details-section-box">
                          <h3 className="section-box-title">Sorted Batches Logs</h3>
                          <div className="details-table-wrapper">
                            <table className="details-inner-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Worker</th>
                                  <th>Note</th>
                                  <th>Worker Fees</th>
                                </tr>
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
                                  <tr>
                                    <td colSpan={4} className="empty-row">No sorted records found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Grand Total Fees Table */}
                        <div className="details-section-box">
                          <h3 className="section-box-title">Total Worker Fees Summary (All Process)</h3>
                          <div className="details-table-wrapper">
                            <table className="details-inner-table">
                              <thead>
                                <tr>
                                  <th>Process Step</th>
                                  <th style={{ textAlign: "right" }}>Total Fees (MMK)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Wash &amp; Grading Worker Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.washWorkerFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr>
                                  <td>Mess Labour Worker Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.mlWorkerFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr>
                                  <td>Purification Supervisor Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.purifySupervisorFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr>
                                  <td>Purification Purifier Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.purifyWorkerFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr>
                                  <td>Girdle-bush Refinement Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.refineWorkerFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr>
                                  <td>Single &amp; Double Drawn Worker Fees</td>
                                  <td style={{ textAlign: "right" }}>{detailsData.metrics.sddWorkerFees.toLocaleString()} MMK</td>
                                </tr>
                                <tr style={{ background: "#eff6ff", fontWeight: "800", fontSize: "15px", color: "#1e40af" }}>
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
