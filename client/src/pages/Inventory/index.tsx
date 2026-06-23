import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { productsAPI, warehousesAPI } from "../../services/api";
import type {
  Product,
  CreateProductDto,
  Warehouse as WarehouseType,
} from "../../types";
import Modal from "../../components/Modal";
import { useNotification } from "../../context/NotificationContext";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import {
  Pencil,
  Trash2,
  Package,
  ClipboardList,
  Building2,
  Search,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from "lucide-react";
import "./index.css";

const Inventory: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProductDto>({
    date: getMyanmarNow(),
    packages: "",
    marker: "",
    unit: "kg",
    weight: 0,
    price: 0,
    currency: "MMK",
    warehouseId: undefined,
  });

  const { showAlert, showConfirm } = useNotification();

  useEffect(() => {
    if (user?.warehouseId) {
      setFormData((prev) => ({ ...prev, warehouseId: user.warehouseId }));
    }
  }, [user]);
  const [weightAdjustment, setWeightAdjustment] = useState<number>(0);
  const [originalWeights, setOriginalWeights] = useState({
    weight: 0,
    remaining: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, warehousesData] = await Promise.all([
        productsAPI.getAll(true),
        warehousesAPI.getAll(),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "weight" || name === "price" || name === "warehouseId"
          ? value === ""
            ? name === "warehouseId"
              ? undefined
              : 0
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const finalData = {
          ...formData,
          date: combineDateWithMyanmarTime(formData.date),
        };
        if (weightAdjustment !== 0) {
          finalData.weight = originalWeights.weight + weightAdjustment;
          finalData.remainingWeight =
            originalWeights.remaining + weightAdjustment;
        }
        await productsAPI.update(editingId, finalData);
        setEditingId(null);
        setIsEditModalOpen(false);
        setWeightAdjustment(0);
      } else {
        await productsAPI.create({
          ...formData,
          date: combineDateWithMyanmarTime(formData.date),
        });
      }
      setFormData({
        date: getMyanmarNow(),
        packages: "",
        marker: "",
        unit: "kg",
        weight: 0,
        price: 0,
        currency: "MMK",
        warehouseId: user?.warehouseId || undefined,
      });
      loadData();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      date: product.date.split("T")[0],
      packages: product.packages,
      marker: product.marker,
      unit: product.unit,
      weight: product.weight,
      price: product.price,
      currency: product.currency,
      remainingWeight: product.remainingWeight,
      warehouseId: product.warehouseId,
    });
    setOriginalWeights({
      weight: product.weight,
      remaining: product.remainingWeight,
    });
    setWeightAdjustment(0);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      async () => {
        try {
          await productsAPI.delete(id);
          loadData();
        } catch (error: any) {
          const message =
            error.response?.data?.message || "Failed to delete product";
          showAlert("Error", message, "error");
          console.error("Failed to delete product:", error);
        }
      },
    );
  };

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    const warehouseName = product.warehouseName || "No Warehouse";
    return (
      product.marker.toLowerCase().includes(term) ||
      product.packages.toLowerCase().includes(term) ||
      warehouseName.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="inventory-page-container fade-in">
      {/* Hero Header */}
      <div className="inventory-hero">
        <div className="inventory-hero-left">
          <div className="inventory-hero-icon">
            <Package size={30} strokeWidth={1.8} />
          </div>
          <div className="inventory-hero-text">
            <h1>Inventory Management</h1>
            <p>Register new products, track stock levels, and monitor warehouse distribution</p>
          </div>
        </div>
        <div className="inventory-hero-right">
          <div className="inventory-stat-pill">
            <span className="stat-num">{products.length}</span>
            <span className="stat-label">{products.length === 1 ? 'Product' : 'Products'}</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="inventory-main-layout">
        {/* Left Column - Register New Product */}
        {hasPermission("Inventory.Create") && (
          <div className="inventory-card">
            <div className="inventory-card-header">
              <div className="inventory-card-title-wrap">
                <Package className="inventory-card-icon" size={20} />
                <h2 className="inventory-card-title">Register Product</h2>
              </div>
            </div>
            <div className="inventory-card-body">
              <form onSubmit={handleSubmit} className="inventory-form">
                <div className="inventory-form-section-title">Stock Details</div>
                <div className="inventory-form-grid">
                  <div className="inventory-input-group">
                    <label className="inventory-label">Date</label>
                    <div className="inventory-input-field-wrapper">
                      <Calendar className="inventory-input-icon" size={16} />
                      <input
                        type="date"
                        name="date"
                        className="inventory-control inventory-control-with-icon"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Warehouse</label>
                    <div className="inventory-input-field-wrapper">
                      <Building2 className="inventory-input-icon" size={16} />
                      <select
                        name="warehouseId"
                        className="inventory-control inventory-control-select inventory-control-with-icon"
                        value={formData.warehouseId || ""}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses
                          .filter(
                            (w) => !user?.warehouseId || w.id === user.warehouseId,
                          )
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Marker</label>
                    <div className="inventory-input-field-wrapper">
                      <input
                        type="text"
                        name="marker"
                        className="inventory-control"
                        value={formData.marker}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter marker"
                      />
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Packages</label>
                    <div className="inventory-input-field-wrapper">
                      <Layers className="inventory-input-icon" size={16} />
                      <input
                        type="text"
                        name="packages"
                        className="inventory-control inventory-control-with-icon"
                        value={formData.packages}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. 50 Bags"
                      />
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Unit</label>
                    <div className="inventory-input-field-wrapper">
                      <select
                        name="unit"
                        className="inventory-control inventory-control-select"
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="kg">kg</option>
                        <option value="viss">viss</option>
                      </select>
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Weight</label>
                    <div className="inventory-input-field-wrapper">
                      <input
                        type="number"
                        name="weight"
                        step="0.01"
                        className="inventory-control inventory-control-with-suffix"
                        value={formData.weight || ""}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="0.00"
                        onFocus={(e) =>
                          e.target.value === "0" && (e.target.value = "")
                        }
                      />
                      <span className="inventory-input-suffix">{formData.unit}</span>
                    </div>
                  </div>

                  <div className="inventory-input-group">
                    <label className="inventory-label">Price</label>
                    <div className="inventory-price-input-group">
                      <div className="inventory-input-field-wrapper" style={{ flex: 1 }}>
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          className="inventory-control"
                          value={formData.price || ""}
                          onChange={handleInputChange}
                          required
                          min="0"
                          placeholder="0.00"
                          onFocus={(e) =>
                            e.target.value === "0" && (e.target.value = "")
                          }
                        />
                      </div>
                      <select
                        name="currency"
                        className="inventory-control inventory-control-select inventory-currency-select"
                        value={formData.currency}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="MMK">MMK</option>
                        <option value="CNY">CNY</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-register-product">
                  <Sparkles size={16} /> Register Product
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column - Product List */}
        <div
          className="inventory-card"
          style={{ gridColumn: !hasPermission("Inventory.Create") ? "1 / -1" : undefined }}
        >
          <div className="inventory-card-header">
            <div className="inventory-card-title-wrap">
              <ClipboardList className="inventory-card-icon" size={20} />
              <h2 className="inventory-card-title">Product List</h2>
            </div>
            <span className="inventory-count-badge">
              {filteredProducts.length} Products
            </span>
          </div>

          <div className="inventory-history-controls">
            <div className="inventory-search-box">
              <Search className="inventory-input-icon" size={16} />
              <input
                type="text"
                className="inventory-search-control"
                placeholder="Search by marker or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="inventory-card-body" style={{ padding: 0 }}>
            <div className="inventory-table-wrap">
              {filteredProducts.length === 0 ? (
                <div className="inventory-empty-state">
                  <Package className="inventory-empty-icon" size={40} />
                  <p className="inventory-empty-text">
                    No products found matching your search.
                  </p>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Warehouse</th>
                      <th>Marker</th>
                      <th>Packages</th>
                      <th>Weight</th>
                      <th>Price</th>
                      <th>Remaining</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {formatDateTime(product.date)}
                        </td>
                        <td>
                          <span className="inventory-badge-warehouse">
                            {product.warehouseName || "No Warehouse"}
                          </span>
                        </td>
                        <td>
                          <div className="inventory-badge-marker">{product.marker}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: "#475569" }}>
                          {product.packages}
                        </td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>
                          {product.weight}{" "}
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {product.unit}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}{" "}
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {product.currency}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`inventory-badge-status ${
                              product.remainingWeight < product.weight * 0.2
                                ? "status-danger"
                                : "status-success"
                            }`}
                          >
                            {product.remainingWeight.toFixed(2)} {product.unit}
                          </span>
                        </td>
                        <td>
                          <div className="inventory-action-buttons">
                            {hasPermission("Inventory.Edit") && (
                              <button
                                className="btn-action-edit"
                                onClick={() => handleEdit(product)}
                                title="Edit Product"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {hasPermission("Inventory.Delete") && (
                              <button
                                className={`btn-action-delete ${
                                  product.isUsed ? "disabled" : ""
                                }`}
                                onClick={() =>
                                  !product.isUsed && handleDelete(product.id)
                                }
                                title={
                                  product.isUsed
                                    ? "Cannot delete: This product has sales or processing records"
                                    : "Delete Product"
                                }
                                disabled={product.isUsed}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingId(null);
          setFormData({
            date: getMyanmarNow(),
            packages: "",
            marker: "",
            unit: "kg",
            weight: 0,
            price: 0,
            currency: "MMK",
            warehouseId: user?.warehouseId || undefined,
          });
        }}
        title="Edit Product"
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} className="inventory-form" style={{ marginTop: "10px" }}>
          <div className="inventory-modal-grid">
            <div className="inventory-input-group">
              <label className="inventory-label">Date</label>
              <div className="inventory-input-field-wrapper">
                <Calendar className="inventory-input-icon" size={16} />
                <input
                  type="date"
                  name="date"
                  className="inventory-control inventory-control-with-icon"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="inventory-input-group">
              <label className="inventory-label">Warehouse</label>
              <div className="inventory-input-field-wrapper">
                <Building2 className="inventory-input-icon" size={16} />
                <select
                  name="warehouseId"
                  className="inventory-control inventory-control-select inventory-control-with-icon"
                  value={formData.warehouseId || ""}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses
                    .filter(
                      (w) => !user?.warehouseId || w.id === user.warehouseId,
                    )
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="inventory-input-group">
              <label className="inventory-label">Marker</label>
              <div className="inventory-input-field-wrapper">
                <input
                  type="text"
                  name="marker"
                  className="inventory-control"
                  value={formData.marker}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter marker"
                />
              </div>
            </div>

            <div className="inventory-input-group">
              <label className="inventory-label">Packages</label>
              <div className="inventory-input-field-wrapper">
                <Layers className="inventory-input-icon" size={16} />
                <input
                  type="text"
                  name="packages"
                  className="inventory-control inventory-control-with-icon"
                  value={formData.packages}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 50 Bags"
                />
              </div>
            </div>

            <div className="inventory-input-group">
              <label className="inventory-label">Unit</label>
              <div className="inventory-input-field-wrapper">
                <select
                  name="unit"
                  className="inventory-control inventory-control-select"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  disabled={originalWeights.remaining < originalWeights.weight}
                >
                  <option value="kg">kg</option>
                  <option value="viss">viss</option>
                </select>
              </div>
            </div>

            <div className="inventory-input-group">
              <label className="inventory-label">Original Weight</label>
              <div className="inventory-input-field-wrapper">
                <input
                  type="number"
                  name="weight"
                  step="0.01"
                  className="inventory-control inventory-control-with-suffix"
                  value={formData.weight || ""}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                  onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                  disabled={originalWeights.remaining < originalWeights.weight}
                />
                <span className="inventory-input-suffix">{formData.unit}</span>
              </div>
            </div>

            {originalWeights.remaining < originalWeights.weight && (
              <div className="inventory-input-group" style={{ gridColumn: "1 / -1" }}>
                <label className="inventory-label" style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={14} /> Adjust Weight (+/-)
                </label>
                <div className="inventory-input-field-wrapper">
                  <input
                    type="number"
                    name="adjustment"
                    step="0.01"
                    className="inventory-control"
                    style={{ borderColor: "#fca5a5", backgroundColor: "#fff5f5" }}
                    value={weightAdjustment || ""}
                    onChange={(e) =>
                      setWeightAdjustment(
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                      )
                    }
                    placeholder="Add (+) or Reduce (-)"
                  />
                </div>
                <div className="inventory-adjustment-preview">
                  <div className="inventory-adjustment-badge badge-total">
                    New Total: <strong>{(originalWeights.weight + weightAdjustment).toFixed(2)}</strong> {formData.unit}
                  </div>
                  <div className="inventory-adjustment-badge badge-remaining">
                    New Remaining: <strong>{(originalWeights.remaining + weightAdjustment).toFixed(2)}</strong> {formData.unit}
                  </div>
                </div>
              </div>
            )}

            <div className="inventory-input-group" style={{ gridColumn: originalWeights.remaining < originalWeights.weight ? "1 / -1" : undefined }}>
              <label className="inventory-label">Price</label>
              <div className="inventory-price-input-group">
                <div className="inventory-input-field-wrapper" style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    className="inventory-control"
                    value={formData.price || ""}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                    onFocus={(e) =>
                      e.target.value === "0" && (e.target.value = "")
                    }
                  />
                </div>
                <select
                  name="currency"
                  className="inventory-control inventory-control-select inventory-currency-select"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="MMK">MMK</option>
                  <option value="CNY">CNY</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="inventory-modal-actions">
            <button type="submit" className="btn-modal-submit">
              Update Product
            </button>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingId(null);
                setFormData({
                  date: getMyanmarNow(),
                  packages: "",
                  marker: "",
                  unit: "kg",
                  weight: 0,
                  price: 0,
                  currency: "MMK",
                  warehouseId: user?.warehouseId || undefined,
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
