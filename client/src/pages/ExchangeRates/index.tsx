import React, { useEffect, useState } from "react";
import { exchangeRatesAPI } from "../../services/api";
import type { ExchangeRate, CreateExchangeRateDto } from "../../types";
import { BadgeDollarSign, Save, Banknote } from "lucide-react";
import "./index.css";

const ExchangeRates: React.FC = () => {
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [usdRate, setUsdRate] = useState<string>("");
  const [cnyRate, setCnyRate] = useState<string>("");
  const [inrRate, setInrRate] = useState<string>("");

  const fetchRates = async () => {
    try {
      const data = await exchangeRatesAPI.getAll();
      setHistory(data);

      // set current active rates into the inputs
      const activeUsd = data.find(
        (r) => r.fromCurrency === "USD" && r.activeStatus,
      );
      if (activeUsd) setUsdRate(activeUsd.rate.toString());

      const activeCny = data.find(
        (r) => r.fromCurrency === "CNY" && r.activeStatus,
      );
      if (activeCny) setCnyRate(activeCny.rate.toString());

      const activeInr = data.find(
        (r) => r.fromCurrency === "INR" && r.activeStatus,
      );
      if (activeInr) setInrRate(activeInr.rate.toString());
    } catch (error) {
      console.error("Failed to fetch exchange rates", error);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSave = async (fromCurrency: string, rateValue: string) => {
    if (!rateValue || isNaN(Number(rateValue))) {
      alert("Please enter a valid rate");
      return;
    }

    try {
      const dto: CreateExchangeRateDto = {
        fromCurrency,
        toCurrency: "MMK",
        rate: Number(rateValue),
        activeStatus: true,
      };
      await exchangeRatesAPI.create(dto);
      alert(`${fromCurrency} to MMK rate saved successfully`);
      fetchRates();
    } catch (error) {
      console.error(`Failed to save ${fromCurrency} rate`, error);
      alert(`Failed to save ${fromCurrency} rate`);
    }
  };

  return (
    <div className="exchange-rates-page fade-in">
    <div className="er-hero fade-in">
      <div className="er-hero-left">
        <div className="er-hero-icon">
          <BadgeDollarSign size={26} strokeWidth={1.8} />
        </div>
        <div className="er-hero-text">
          <h1>Currency Exchange Rates</h1>
          <p>Manage and update exchange rates for all currencies</p>
        </div>
      </div>
      <div className="er-hero-right">
        <div className="er-stat-pill">
          <span className="stat-num">{history.length}</span>
          <span className="stat-label">Records</span>
        </div>
      </div>
    </div>

      <div className="exchange-grid">
        <div className="exchange-card">
          <h3>
            <Banknote size={24} color="#10b981" /> USD to MMK
          </h3>
          <div className="currency-row">
            <span className="currency-label">1 USD =</span>
            <input
              type="number"
              className="currency-input"
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value)}
              placeholder="0"
            />
            <span className="currency-unit">MMK</span>
            <button
              className="btn-save"
              onClick={() => handleSave("USD", usdRate)}
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        <div className="exchange-card">
          <h3>
            <Banknote size={24} color="#f59e0b" /> CNY to MMK
          </h3>
          <div className="currency-row">
            <span className="currency-label">1 CNY =</span>
            <input
              type="number"
              className="currency-input"
              value={cnyRate}
              onChange={(e) => setCnyRate(e.target.value)}
              placeholder="0"
            />
            <span className="currency-unit">MMK</span>
            <button
              className="btn-save"
              onClick={() => handleSave("CNY", cnyRate)}
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        <div className="exchange-card">
          <h3>
            <Banknote size={24} color="#3b82f6" /> INR to MMK
          </h3>
          <div className="currency-row">
            <span className="currency-label">1 INR =</span>
            <input
              type="number"
              className="currency-input"
              value={inrRate}
              onChange={(e) => setInrRate(e.target.value)}
              placeholder="0"
            />
            <span className="currency-unit">MMK</span>
            <button
              className="btn-save"
              onClick={() => handleSave("INR", inrRate)}
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="history-section">
        <h3>Exchange Rate History</h3>
        <div className="table-container" style={{ marginTop: "16px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createDate).toLocaleString()}</td>
                  <td>{item.fromCurrency}</td>
                  <td>{item.toCurrency}</td>
                  <td
                    style={{
                      fontWeight:
                        typeof item.activeStatus === "boolean" &&
                        item.activeStatus
                          ? "bold"
                          : "normal",
                    }}
                  >
                    {item.rate.toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={
                        item.activeStatus ? "status-active" : "status-inactive"
                      }
                    >
                      {item.activeStatus ? "Active" : "History"}
                    </span>
                  </td>
                  <td>{item.createBy}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No exchange history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRates;
