import React, { useEffect, useState, useMemo } from "react";
import { dashboardAPI } from "../../services/api";
import type { DashboardStats, MarkerSortingStats } from "../../types";
import {
  Package,
  TrendingUp,
  Scale,
  ShoppingCart,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  BarChart2,
  Tag,
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
const fmtInt = (n: number) => n.toLocaleString();

const KpiCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  delay?: string;
}> = ({ title, value, sub, icon, gradient, glow, delay = "0s" }) => (
  <div className="db-kpi-card" style={{ animationDelay: delay }}>
    <div
      className="db-kpi-icon"
      style={{ background: gradient, boxShadow: glow }}
    >
      {icon}
    </div>
    <div className="db-kpi-body">
      <p className="db-kpi-title">{title}</p>
      <h3 className="db-kpi-value">{value}</h3>
      {sub && <p className="db-kpi-sub">{sub}</p>}
    </div>
    <div className="db-kpi-shimmer" />
  </div>
);

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
      {/* Header */}
      <div className="db-header">
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

      {/* KPI Cards */}
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
      </div>

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
                        <div className="db-marker-cell">
                          <span className="db-marker-dot" />
                          <span className="db-marker-name">{m.marker}</span>
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
    </div>
  );
};

export default Dashboard;
