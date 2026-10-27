import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { salesAPI, productsAPI, exchangeRatesAPI } from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import type { Sale, Product, CreateSaleDto, ExchangeRate } from "../../types";
import {
  Trash2,
  ShoppingCart,
  TrendingUp,
  Search,
  ClipboardList,
  User,
  Phone,
  AlignLeft,
  ArrowLeftRight,
  BadgeDollarSign,
} from "lucide-react";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import "./index.css";

// Conversion: 1 viss = 1.633 kg
const VISS_TO_KG = 1.633;
const toKg = (viss: number) => parseFloat((viss * VISS_TO_KG).toFixed(4));
const toViss = (kg: number) => parseFloat((kg / VISS_TO_KG).toFixed(4));
const getBothUnits = (weight: number, storedUnit: string) => {
  const isViss = (storedUnit || "").toLowerCase().trim() === "viss";
  if (isViss) {
    return { viss: weight, kg: toKg(weight) };
  } else {
    return { kg: weight, viss: toViss(weight) };
  }
};

const getMmkRate = (currency: string, rates: ExchangeRate[]): number => {
  const curr = (currency || "").toUpperCase().trim();
  if (curr === "MMK") return 1;
  const match = rates.find(
    (r) =>
      r.fromCurrency.toUpperCase() === curr &&
      r.toCurrency.toUpperCase() === "MMK",
  );
  if (match && match.rate > 0) return match.rate;
  if (curr === "USD") return 4300;
  if (curr === "CNY") return 590;
  if (curr === "INR") return 42;
  return 1;
};

const getExchangeRateRecord = (
  currency: string,
  rates: ExchangeRate[],
): ExchangeRate | undefined => {
  const curr = (currency || "").toUpperCase().trim();
  return rates.find(
    (r) =>
      r.fromCurrency.toUpperCase() === curr &&
      r.toCurrency.toUpperCase() === "MMK",
  );
};

const convertCurrency = (
  amount: number,
  fromCurr: string,
  toCurr: string,
  rates: ExchangeRate[],
): number => {
  if (fromCurr.toUpperCase() === toCurr.toUpperCase()) return amount;
  const fromRate = getMmkRate(fromCurr, rates);
  const toRate = getMmkRate(toCurr, rates);
  return parseFloat(((amount * fromRate) / toRate).toFixed(2));
};

const PAGE_CATEGORY = "Sales";
const CURRENCIES = ["MMK", "USD", "CNY", "INR"] as const;

const Sales: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightAdjustment, setWeightAdjustment] = useState<number>(0);
  const [weightStr, setWeightStr] = useState<string>("");
  const [priceStr, setPriceStr] = useState<string>("");
  const [weightAdjustmentStr, setWeightAdjustmentStr] = useState<string>("");
  const [inputUnit, setInputUnit] = useState<"kg" | "viss">("kg");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [formData, setFormData] = useState<CreateSaleDto>({
    date: getMyanmarNow(),
    productId: 0,
    marker: "",
    unit: "kg",
    weight: 0,
    price: 0,
    currency: "MMK",
    category: PAGE_CATEGORY,
    plusMinusWeight: 0,
    customerName: "",
    customerContact: "",
    remark: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [salesData, productsData, ratesData] = await Promise.all([
        salesAPI.getAll(PAGE_CATEGORY),
        productsAPI.getAll(),
        exchangeRatesAPI.getActive(),
      ]);
      setSales(salesData);
      setProducts(productsData.filter((p) => p.remainingWeight > 0));
      setExchangeRates(ratesData);
    } catch (error) {
      console.error("Failed to load sales data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLongPoll(loadData);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "productId") {
      const selectedProduct = products.find((p) => p.id === parseInt(value));
      if (selectedProduct) {
        const prodUnit =
          (selectedProduct.unit || "").toLowerCase().trim() === "viss"
            ? "viss"
            : "kg";
        const prodCurr = selectedProduct.currency || "MMK";
        setInputUnit(prodUnit);

        const initialPrice = selectedProduct.price;
        setPriceStr(initialPrice > 0 ? initialPrice.toString() : "");

        const rateRec = getExchangeRateRecord(prodCurr, exchangeRates);
        const rateVal = getMmkRate(prodCurr, exchangeRates);

        setFormData((prev) => ({
          ...prev,
          productId: selectedProduct.id,
          marker: selectedProduct.marker,
          unit: prodUnit,
          price: initialPrice,
          currency: prodCurr,
          exchangeRateId: prodCurr === "MMK" ? undefined : rateRec?.id,
          exchangeRateRate: prodCurr === "MMK" ? 1 : rateVal,
        }));
      }
    } else if (name === "weight") {
      setWeightStr(value);
      setFormData((prev) => ({
        ...prev,
        unit: inputUnit,
        weight: value === "" ? 0 : parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPriceStr(val);
    setFormData((prev) => ({
      ...prev,
      price: val === "" ? 0 : parseFloat(val) || 0,
    }));
  };

  const handleSelectCurrency = (newCurrency: string) => {
    if (newCurrency === formData.currency) return;
    const oldCurrency = formData.currency || "MMK";
    const currentPrice = formData.price || 0;

    const convertedPrice = convertCurrency(
      currentPrice,
      oldCurrency,
      newCurrency,
      exchangeRates,
    );
    setPriceStr(convertedPrice > 0 ? convertedPrice.toString() : "");

    const rateRec = getExchangeRateRecord(newCurrency, exchangeRates);
    const rateVal = getMmkRate(newCurrency, exchangeRates);

    setFormData((prev) => ({
      ...prev,
      currency: newCurrency,
      price: convertedPrice,
      exchangeRateId: newCurrency === "MMK" ? undefined : rateRec?.id,
      exchangeRateRate: newCurrency === "MMK" ? 1 : rateVal,
    }));
  };

  const handleSelectUnit = (newUnit: "kg" | "viss") => {
    if (newUnit === inputUnit) return;
    const currentPrice = formData.price || 0;
    let convertedPrice = currentPrice;
    if (inputUnit === "kg" && newUnit === "viss") {
      convertedPrice = parseFloat((currentPrice * VISS_TO_KG).toFixed(2));
    } else if (inputUnit === "viss" && newUnit === "kg") {
      convertedPrice = parseFloat((currentPrice / VISS_TO_KG).toFixed(2));
    }

    setInputUnit(newUnit);
    setPriceStr(convertedPrice > 0 ? convertedPrice.toString() : "");
    setFormData((prev) => ({
      ...prev,
      unit: newUnit,
      price: convertedPrice,
    }));
  };

  const handleConvertWeight = () => {
    const currentWeight = parseFloat(weightStr) || 0;
    const newUnit = inputUnit === "kg" ? "viss" : "kg";
    const convertedWeight =
      newUnit === "viss" ? toViss(currentWeight) : toKg(currentWeight);

    const currentPrice = formData.price || 0;
    let convertedPrice = currentPrice;
    if (inputUnit === "kg" && newUnit === "viss") {
      convertedPrice = parseFloat((currentPrice * VISS_TO_KG).toFixed(2));
    } else if (inputUnit === "viss" && newUnit === "kg") {
      convertedPrice = parseFloat((currentPrice / VISS_TO_KG).toFixed(2));
    }

    setInputUnit(newUnit);
    setWeightStr(currentWeight > 0 ? convertedWeight.toString() : "");
    setPriceStr(convertedPrice > 0 ? convertedPrice.toString() : "");
    setFormData((prev) => ({
      ...prev,
      unit: newUnit,
      weight: convertedWeight,
      price: convertedPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeCurr = formData.currency || "MMK";
      const rateRec = getExchangeRateRecord(activeCurr, exchangeRates);
      const rateVal = getMmkRate(activeCurr, exchangeRates);

      await salesAPI.create({
        ...formData,
        unit: inputUnit,
        plusMinusWeight: weightAdjustment,
        exchangeRateId: activeCurr === "MMK" ? undefined : (formData.exchangeRateId || rateRec?.id),
        exchangeRateRate: activeCurr === "MMK" ? 1 : (formData.exchangeRateRate || rateVal),
        date: combineDateWithMyanmarTime(formData.date),
      });

      setFormData({
        date: getMyanmarNow(),
        productId: 0,
        marker: "",
        unit: "kg",
        weight: 0,
        price: 0,
        currency: "MMK",
        category: PAGE_CATEGORY,
        plusMinusWeight: 0,
        customerName: "",
        customerContact: "",
        remark: "",
      });
      setWeightAdjustment(0);
      setWeightStr("");
      setPriceStr("");
      setWeightAdjustmentStr("");
      setInputUnit("kg");
      loadData();
    } catch (error: any) {
      showAlert(
        "Error",
        error.response?.data?.message || "Failed to create sale",
        "error",
      );
    }
  };

  const handleDeleteSale = (id: number) => {
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this sale record? Product weight will be restored.",
      async () => {
        try {
          await salesAPI.delete(id);
          loadData();
        } catch (error: any) {
          showAlert(
            "Error",
            error.response?.data?.message || "Failed to delete sale",
            "error",
          );
        }
      },
    );
  };

  const getRemainingAfterSale = () => {
    const product = products.find((p) => p.id === formData.productId);
    if (!product) return 0;

    const prodUnit = (product.unit || "").toLowerCase().trim();
    const isProductKg = prodUnit === "kg" || prodUnit === "kilogram";
    const isSaleKg = inputUnit === "kg";

    let soldInProductUnit = formData.weight || 0;
    let adjInProductUnit = weightAdjustment || 0;

    if (isProductKg && !isSaleKg) {
      soldInProductUnit = (formData.weight || 0) * VISS_TO_KG;
      adjInProductUnit = (weightAdjustment || 0) * VISS_TO_KG;
    } else if (!isProductKg && isSaleKg) {
      soldInProductUnit = (formData.weight || 0) / VISS_TO_KG;
      adjInProductUnit = (weightAdjustment || 0) / VISS_TO_KG;
    }

    return product.remainingWeight + adjInProductUnit - soldInProductUnit;
  };

  const filteredSales = sales.filter((sale) => {
    const term = searchTerm.toLowerCase();

    // Date range filter
    if (fromDate) {
      const saleDate = new Date(sale.date.split("T")[0]);
      const filterFrom = new Date(fromDate);
      if (saleDate < filterFrom) return false;
    }
    if (toDate) {
      const saleDate = new Date(sale.date.split("T")[0]);
      const filterTo = new Date(toDate);
      if (saleDate > filterTo) return false;
    }

    return (
      sale.marker.toLowerCase().includes(term) ||
      (sale.customerName?.toLowerCase() || "").includes(term) ||
      (sale.customerContact?.toLowerCase() || "").includes(term) ||
      (sale.sellerName?.toLowerCase() || "").includes(term) ||
      (sale.warehouseName?.toLowerCase() || "").includes(term) ||
      (sale.remark?.toLowerCase() || "").includes(term)
    );
  });

  if (loading) {
    return <div className="spinner"></div>;
  }

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const currentMmkRate = getMmkRate(formData.currency, exchangeRates);

  return (
    <div className="sales-page-container fade-in">
      {/* Hero Header */}
      <div className="sales-hero">
        <div className="sales-hero-left">
          <div className="sales-hero-icon">
            <ShoppingCart size={30} strokeWidth={1.8} />
          </div>
          <div className="sales-hero-text">
            <h1>Sales Management</h1>
            <p>
              Monitor transactions, adjust product weights, and register new raw
              material sales
            </p>
          </div>
        </div>
        <div className="sales-hero-right">
          <div className="sales-stat-pill">
            <span className="stat-num">{sales.length}</span>
            <span className="stat-label">
              {sales.length === 1 ? "Transaction" : "Transactions"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="sales-main-layout">
        {/* Left Column - New Sale Form */}
        {hasPermission("Sales.Create") && (
          <div className="sales-card">
            <div className="sales-card-header">
              <div className="sales-card-title-wrap">
                <ShoppingCart className="sales-card-icon" size={20} />
                <h2 className="sales-card-title">New Sale Transaction</h2>
              </div>
            </div>
            <div className="sales-card-body">
              <form onSubmit={handleSubmit} className="sales-form">
                <div className="sales-form-section-title">Product & Sizing</div>
                <div className="sales-form-grid">
                  <div className="sales-input-group">
                    <label className="sales-label">
                      Select Product (Marker)
                    </label>
                    <div className="sales-input-field-wrapper">
                      <select
                        name="productId"
                        className="sales-control sales-control-select"
                        value={formData.productId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="0">-- Select Product --</option>
                        {products.map((p) => {
                          const isKg =
                            (p.unit || "").toLowerCase().trim() === "kg";
                          const otherUnit = isKg ? "viss" : "kg";
                          const otherVal = isKg
                            ? p.remainingWeight / VISS_TO_KG
                            : p.remainingWeight * VISS_TO_KG;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.marker} ({p.remainingWeight} {p.unit} /{" "}
                              {otherVal.toFixed(2)} {otherUnit} available)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="sales-input-group">
                    <div className="sales-weight-header-row">
                      <label className="sales-label" style={{ margin: 0 }}>
                        Weight to Sell
                      </label>
                      <div className="sales-unit-choice-wrap">
                        <span className="sales-unit-choice-label">Unit:</span>
                        <div className="sales-unit-segmented">
                          <button
                            type="button"
                            className={`sales-unit-segment-btn ${inputUnit === "kg" ? "active" : ""}`}
                            onClick={() => handleSelectUnit("kg")}
                          >
                            KG
                          </button>
                          <button
                            type="button"
                            className={`sales-unit-segment-btn ${inputUnit === "viss" ? "active" : ""}`}
                            onClick={() => handleSelectUnit("viss")}
                          >
                            Viss
                          </button>
                        </div>
                        <button
                          type="button"
                          className="sales-unit-convert-pill"
                          onClick={handleConvertWeight}
                          title="Convert entered value between KG and Viss"
                        >
                          <ArrowLeftRight size={11} />
                          <span>Convert</span>
                        </button>
                      </div>
                    </div>
                    <div className="sales-input-field-wrapper">
                      <input
                        type="number"
                        name="weight"
                        step="any"
                        className="sales-control sales-control-with-suffix"
                        value={weightStr}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="0"
                      />
                      <span className="sales-input-suffix">
                        {inputUnit.toUpperCase()}
                      </span>
                    </div>
                    {formData.weight > 0 && (
                      <div className="sales-conversion-hint">
                        ≈{" "}
                        {inputUnit === "viss"
                          ? `${(formData.weight * VISS_TO_KG).toFixed(3)} kg`
                          : `${(formData.weight / VISS_TO_KG).toFixed(3)} viss`}
                        <span className="sales-conversion-formula">
                          ({inputUnit === "viss" ? "1 viss = 1.633 kg" : "1.633 kg = 1 viss"})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="sales-input-group">
                    <label className="sales-label">+/- Weight Adjustment</label>
                    <div className="sales-input-field-wrapper">
                      <input
                        type="number"
                        step="any"
                        className="sales-control sales-control-with-suffix"
                        value={weightAdjustmentStr}
                        onChange={(e) => {
                          setWeightAdjustmentStr(e.target.value);
                          setWeightAdjustment(
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                          );
                        }}
                        placeholder="0"
                        style={{
                          borderColor:
                            weightAdjustment > 0
                              ? "#16a34a"
                              : weightAdjustment < 0
                                ? "#dc2626"
                                : undefined,
                          backgroundColor:
                            weightAdjustment > 0
                              ? "#f0fdf4"
                              : weightAdjustment < 0
                                ? "#fef2f2"
                                : undefined,
                          color:
                            weightAdjustment > 0
                              ? "#15803d"
                              : weightAdjustment < 0
                                ? "#b91c1c"
                                : undefined,
                          fontWeight: weightAdjustment !== 0 ? 600 : undefined,
                        }}
                      />
                      <span className="sales-input-suffix">
                        {inputUnit.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Price per Unit - Fully Editable & Multi-Currency */}
                  <div className="sales-input-group">
                    <div className="sales-price-header-row">
                      <label className="sales-label" style={{ margin: 0 }}>
                        Price per Unit ({inputUnit.toUpperCase()})
                      </label>
                      <div className="sales-currency-segmented">
                        {CURRENCIES.map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            className={`sales-currency-btn ${formData.currency === curr ? "active" : ""}`}
                            onClick={() => handleSelectCurrency(curr)}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="sales-input-field-wrapper">
                      <input
                        type="number"
                        name="price"
                        step="any"
                        className="sales-control sales-control-with-suffix"
                        value={priceStr}
                        onChange={handlePriceChange}
                        required
                        placeholder="Enter price per unit"
                      />
                      <span className="sales-input-suffix">
                        {formData.currency}
                      </span>
                    </div>
                    {formData.currency !== "MMK" && (
                      <div className="sales-rate-hint">
                        <BadgeDollarSign size={13} />
                        <span>
                          1 {formData.currency} = {currentMmkRate.toLocaleString()} MMK
                        </span>
                        <span className="sales-rate-badge">Rate saved with record</span>
                      </div>
                    )}
                  </div>

                  {/* Calculations Info widgets */}
                  <div className="sales-calculator-panels">
                    <div className="sales-calc-panel sales-calc-panel-blue">
                      <span className="sales-calc-label">Total Amount</span>
                      <span className="sales-calc-value">
                        {(
                          (formData.weight || 0) * (formData.price || 0)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span style={{ fontSize: "10px", fontWeight: "600" }}>
                          {formData.currency}
                        </span>
                      </span>
                      {formData.currency !== "MMK" && (
                        <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: 500, marginTop: "2px" }}>
                          ≈ {(
                            (formData.weight || 0) * (formData.price || 0) * currentMmkRate
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          <span style={{ fontSize: "9px" }}>MMK</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`sales-calc-panel ${
                        getRemainingAfterSale() < 0
                          ? "sales-calc-panel-red"
                          : "sales-calc-panel-green"
                      }`}
                    >
                      <span className="sales-calc-label">Remaining</span>
                      <span className="sales-calc-value">
                        {(() => {
                          const prodUnit =
                            (selectedProduct?.unit || "kg")
                              .toLowerCase()
                              .trim() === "viss"
                              ? "viss"
                              : "kg";
                          const otherUnit = prodUnit === "kg" ? "viss" : "kg";
                          const rem = getRemainingAfterSale();
                          const remOther =
                            prodUnit === "kg"
                              ? rem / VISS_TO_KG
                              : rem * VISS_TO_KG;
                          return (
                            <>
                              <span>
                                {rem.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {prodUnit}
                                </span>
                              </span>
                              <div
                                style={{
                                  fontSize: "11px",
                                  opacity: 0.8,
                                  fontWeight: 500,
                                  marginTop: "2px",
                                }}
                              >
                                ≈{" "}
                                {remOther.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                <span style={{ fontSize: "9px" }}>
                                  {otherUnit}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sales-form-section-title">Customer & Date</div>
                <div className="sales-form-grid">
                  <div className="sales-input-group">
                    <label className="sales-label">Date</label>
                    <div className="sales-input-field-wrapper">
                      <input
                        type="date"
                        name="date"
                        className="sales-control"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="sales-input-group">
                    <label className="sales-label">Customer Name</label>
                    <div className="sales-input-field-wrapper">
                      <User className="sales-input-icon" size={16} />
                      <input
                        type="text"
                        name="customerName"
                        className="sales-control sales-control-with-icon"
                        value={formData.customerName || ""}
                        onChange={handleInputChange}
                        placeholder="Customer name (optional)"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="sales-input-group">
                    <label className="sales-label">Customer Contact</label>
                    <div className="sales-input-field-wrapper">
                      <Phone className="sales-input-icon" size={16} />
                      <input
                        type="text"
                        name="customerContact"
                        className="sales-control sales-control-with-icon"
                        value={formData.customerContact || ""}
                        onChange={handleInputChange}
                        placeholder="Phone or email (optional)"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="sales-input-group">
                    <label className="sales-label">Remark</label>
                    <div className="sales-input-field-wrapper">
                      <AlignLeft
                        className="sales-input-icon"
                        style={{ top: "16px" }}
                        size={16}
                      />
                      <textarea
                        name="remark"
                        className="sales-control sales-control-with-icon"
                        value={formData.remark || ""}
                        onChange={handleInputChange}
                        placeholder="Add remarks (optional)"
                        maxLength={1000}
                        rows={2}
                        style={{ resize: "vertical" }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-complete-sale"
                  disabled={getRemainingAfterSale() < 0}
                >
                  <TrendingUp size={16} /> Complete Sale
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column - Sales History list */}
        <div
          className="sales-card"
          style={{
            gridColumn: !hasPermission("Sales.Create") ? "1 / -1" : undefined,
          }}
        >
          <div className="sales-card-header">
            <div className="sales-card-title-wrap">
              <ClipboardList className="sales-card-icon" size={20} />
              <h2 className="sales-card-title">Sales History</h2>
            </div>
            <span className="rf-count-badge" style={{ margin: 0 }}>
              {filteredSales.length} Transactions
            </span>
          </div>

          <div className="sales-history-controls">
            <div className="sales-search-box">
              <Search className="sales-input-icon" size={16} />
              <input
                type="text"
                className="sales-search-control"
                placeholder="Search sales history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sales-date-filter">
              <div className="sales-date-field">
                <span className="sales-date-label">From</span>
                <input
                  type="date"
                  className="sales-date-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="sales-date-field">
                <span className="sales-date-label">To</span>
                <input
                  type="date"
                  className="sales-date-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  className="sales-date-clear-btn"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="sales-card-body" style={{ padding: 0 }}>
            <div className="sales-table-wrap">
              {filteredSales.length === 0 ? (
                <div className="sales-empty-state">
                  <ShoppingCart className="sales-empty-icon" size={40} />
                  <p className="sales-empty-text">
                    No sale transactions match your search criteria.
                  </p>
                </div>
              ) : (
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Marker</th>
                      <th>Weight</th>
                      <th>+/- Weight</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Seller</th>
                      <th>Customer Details</th>
                      <th>Remark</th>
                      {hasPermission("Sales.Delete") && (
                        <th style={{ textAlign: "center" }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {formatDateTime(sale.date)}
                        </td>
                        <td>
                          <div className="sales-badge-marker">
                            {sale.marker}
                          </div>
                          <div className="sales-badge-warehouse">
                            {sale.warehouseName}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>
                          {(() => {
                            const units = getBothUnits(sale.weight, sale.unit);
                            return (
                              <>
                                <div>
                                  {units.kg.toFixed(3)}{" "}
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#64748b",
                                    }}
                                  >
                                    kg
                                  </span>
                                </div>
                                <div
                                  style={{
                                    color: "#64748b",
                                    fontSize: "12px",
                                  }}
                                >
                                  {units.viss.toFixed(3)}{" "}
                                  <span style={{ fontSize: "10px" }}>
                                    viss
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td
                          style={{
                            color:
                              sale.plusMinusWeight > 0
                                ? "#15803d"
                                : sale.plusMinusWeight < 0
                                  ? "#b91c1c"
                                  : "#64748b",
                            fontWeight:
                              sale.plusMinusWeight !== 0 ? 600 : undefined,
                          }}
                        >
                          {sale.plusMinusWeight > 0
                            ? `+${sale.plusMinusWeight}`
                            : sale.plusMinusWeight || 0}{" "}
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {sale.unit}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div>
                            {sale.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            <span
                              style={{ fontSize: "11px", color: "#64748b" }}
                            >
                              {sale.currency}
                            </span>
                          </div>
                          {sale.currency !== "MMK" && sale.exchangeRateRate && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#059669",
                                fontWeight: 600,
                              }}
                            >
                              Rate: {sale.exchangeRateRate.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td
                          className="sales-row-total"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <div>
                            {(sale.weight * sale.price).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            <span
                              style={{ fontSize: "11px", color: "#64748b" }}
                            >
                              {sale.currency}
                            </span>
                          </div>
                          {sale.currency !== "MMK" && sale.exchangeRateRate && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              ≈{" "}
                              {(
                                sale.weight *
                                sale.price *
                                sale.exchangeRateRate
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}{" "}
                              MMK
                            </div>
                          )}
                        </td>
                        <td>{sale.sellerName}</td>
                        <td>
                          {sale.customerName ? (
                            <>
                              <div className="sales-badge-customer">
                                {sale.customerName}
                              </div>
                              {sale.customerContact && (
                                <div className="sales-badge-contact">
                                  {sale.customerContact}
                                </div>
                              )}
                            </>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>-</span>
                          )}
                        </td>
                        <td
                          style={{ maxWidth: "200px", wordBreak: "break-word" }}
                        >
                          {sale.remark || (
                            <span style={{ color: "#94a3b8" }}>-</span>
                          )}
                        </td>
                        {hasPermission("Sales.Delete") && (
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteSale(sale.id)}
                              title="Delete Sale"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "8px",
                                transition: "all 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#fee2e2")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
