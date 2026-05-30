import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { salesAPI, productsAPI } from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import type { Sale, Product, CreateSaleDto } from "../../types";
import { Trash2 } from "lucide-react";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import "./index.css";

const PAGE_CATEGORY = "Sales";

const Sales: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightAdjustment, setWeightAdjustment] = useState<number>(0);
  const [formData, setFormData] = useState<CreateSaleDto>({
    date: getMyanmarNow(),
    productId: 0,
    marker: "",
    unit: "kg",
    weight: 0,
    price: 0,
    currency: "MMK",
    category: PAGE_CATEGORY,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, productsData] = await Promise.all([
        salesAPI.getAll(PAGE_CATEGORY),
        productsAPI.getAll(),
      ]);
      setSales(salesData);
      setProducts(productsData.filter((p) => p.remainingWeight > 0));
    } catch (error) {
      console.error("Failed to load sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "productId") {
      const selectedProduct = products.find((p) => p.id === parseInt(value));
      if (selectedProduct) {
        setFormData((prev) => ({
          ...prev,
          productId: selectedProduct.id,
          marker: selectedProduct.marker,
          unit: selectedProduct.unit,
          price: selectedProduct.price,
          currency: selectedProduct.currency,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "weight" || name === "price"
            ? value === ""
              ? 0
              : parseFloat(value)
            : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesAPI.create({
        ...formData,
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
      });
      setWeightAdjustment(0);
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
    return product.remainingWeight + weightAdjustment - formData.weight;
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="sales fade-in">
      <h1 className="page-title">Sales Management</h1>

      {hasPermission("Sales.Create") && (
        <div className="card registration-card">
          <h2 className="card-title">New Sale Transaction</h2>
          <form onSubmit={handleSubmit} className="sale-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Product (Marker)</label>
                <select
                  name="productId"
                  className="form-select"
                  value={formData.productId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="0">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.marker} ({p.remainingWeight} {p.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Weight to Sell</label>
                <input
                  type="number"
                  name="weight"
                  step="0.01"
                  className="form-control"
                  value={formData.weight || ""}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  placeholder="0"
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">+/- Weight</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={weightAdjustment === 0 ? "" : weightAdjustment}
                  onChange={(e) =>
                    setWeightAdjustment(
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                    )
                  }
                  placeholder="0"
                  style={{
                    borderColor: weightAdjustment > 0 ? '#16a34a' : weightAdjustment < 0 ? '#dc2626' : undefined,
                    backgroundColor: weightAdjustment > 0 ? '#f0fdf4' : weightAdjustment < 0 ? '#fef2f2' : undefined,
                    color: weightAdjustment > 0 ? '#15803d' : weightAdjustment < 0 ? '#b91c1c' : undefined,
                    fontWeight: weightAdjustment !== 0 ? 600 : undefined,
                    transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price</label>
                <div className="price-input-group">
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    className="form-control"
                    value={formData.price || ""}
                    readOnly
                    style={{
                      backgroundColor: "#f8fafc",
                      cursor: "not-allowed",
                    }}
                    required
                    placeholder="0"
                    onFocus={(e) =>
                      e.target.value === "0" && (e.target.value = "")
                    }
                  />
                  <span
                    style={{
                      padding: "0 15px",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0 8px 8px 0",
                      border: "1px solid #e2e8f0",
                      borderLeft: "none",
                      fontWeight: 600,
                      color: "#475569",
                      minWidth: "70px",
                      justifyContent: "center",
                    }}
                  >
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount</label>
                <div className="price-input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={(
                      (formData.weight || 0) * (formData.price || 0)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    readOnly
                    style={{
                      backgroundColor: "#f0f9ff",
                      fontWeight: "bold",
                      color: "#0369a1",
                      cursor: "default",
                    }}
                  />
                  <span
                    style={{
                      padding: "0 15px",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#e0f2fe",
                      borderRadius: "0 8px 8px 0",
                      border: "1px solid #bae6fd",
                      borderLeft: "none",
                      fontWeight: 600,
                      color: "#0369a1",
                      minWidth: "70px",
                      justifyContent: "center",
                    }}
                  >
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Total Remaining (After Sale)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={`${getRemainingAfterSale().toFixed(2)} ${formData.unit}`}
                  disabled
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Complete Sale
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card list-card">
        <h2 className="card-title">Sales History</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Marker</th>
                <th>Weight</th>
                <th>Price</th>
                <th>Total</th>
                <th>Seller</th>
                {hasPermission("Sales.Delete") && (
                  <th style={{ textAlign: "center" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{formatDateTime(sale.date)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sale.marker}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {sale.warehouseName}
                    </div>
                  </td>
                  <td>
                    {sale.weight} {sale.unit}
                  </td>
                  <td>
                    {sale.price} {sale.currency}
                  </td>
                  <td>
                    {(sale.weight * sale.price).toFixed(2)} {sale.currency}
                  </td>
                  <td>{sale.sellerName}</td>
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
                          padding: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#fee2e2")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
