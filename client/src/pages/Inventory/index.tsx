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

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="warehouse fade-in">
      <h1 className="page-title">Inventory Management</h1>

      {hasPermission("Inventory.Create") && (
        <div className="card registration-card">
          <h2 className="card-title">Register New Product</h2>
          <form onSubmit={handleSubmit} className="product-form">
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
                <label className="form-label">Warehouse</label>
                <select
                  name="warehouseId"
                  className="form-select"
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

              <div className="form-group">
                <label className="form-label">Marker</label>
                <input
                  type="text"
                  name="marker"
                  className="form-control"
                  value={formData.marker}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter marker"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Packages</label>
                <input
                  type="text"
                  name="packages"
                  className="form-control"
                  value={formData.packages}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 50 Bags"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  name="unit"
                  className="form-select"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="kg">kg</option>
                  <option value="viss">viss</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Weight</label>
                <input
                  type="number"
                  name="weight"
                  step="0.01"
                  className="form-control"
                  value={formData.weight || ""}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
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
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                    onFocus={(e) =>
                      e.target.value === "0" && (e.target.value = "")
                    }
                  />
                  <select
                    name="currency"
                    className="form-select currency-select"
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

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Register Product
              </button>
            </div>
          </form>
        </div>
      )}

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
        maxWidth="1000px"
      >
        <form onSubmit={handleSubmit} className="product-form">
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
              <label className="form-label">Warehouse</label>
              <select
                name="warehouseId"
                className="form-select"
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

            <div className="form-group">
              <label className="form-label">Marker</label>
              <input
                type="text"
                name="marker"
                className="form-control"
                value={formData.marker}
                onChange={handleInputChange}
                required
                placeholder="Enter marker"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Packages</label>
              <input
                type="text"
                name="packages"
                className="form-control"
                value={formData.packages}
                onChange={handleInputChange}
                required
                placeholder="e.g. 50 Bags"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit</label>
              <select
                name="unit"
                className="form-select"
                value={formData.unit}
                onChange={handleInputChange}
                required
                disabled={originalWeights.remaining < originalWeights.weight}
              >
                <option value="kg">kg</option>
                <option value="viss">viss</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Weight</label>
              <input
                type="number"
                name="weight"
                step="0.01"
                className="form-control"
                value={formData.weight || ""}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="0"
                onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                disabled={originalWeights.remaining < originalWeights.weight}
              />
            </div>

            {originalWeights.remaining < originalWeights.weight && (
              <div className="form-group">
                <label className="form-label" style={{ color: "#ef4444" }}>
                  Adjust Weight (+/-)
                </label>
                <input
                  type="number"
                  name="adjustment"
                  step="0.01"
                  className="form-control"
                  style={{ borderColor: "#ef4444" }}
                  value={weightAdjustment || ""}
                  onChange={(e) =>
                    setWeightAdjustment(
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                    )
                  }
                  placeholder="Add (+) or Reduce (-)"
                />
                <div style={{ marginTop: "8px", fontSize: "14px" }}>
                  <span style={{ marginRight: "16px" }}>
                    New Total:{" "}
                    <strong>
                      {(originalWeights.weight + weightAdjustment).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    New Remaining:{" "}
                    <strong>
                      {(originalWeights.remaining + weightAdjustment).toFixed(
                        2,
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Price</label>
              <div className="price-input-group">
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  className="form-control"
                  value={formData.price || ""}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                />
                <select
                  name="currency"
                  className="form-select currency-select"
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Update Product
            </button>
            <button
              type="button"
              className="btn btn-secondary"
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

      <div className="card list-card">
        <h2 className="card-title">Product List</h2>
        <div className="table-container">
          <table className="table inventory-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Warehouse</th>
                <th>Marker</th>
                <th>Packages</th>
                <th>Weight</th>
                <th>Price</th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{formatDateTime(product.date)}</td>
                  <td>
                    <span
                      className="warehouse-badge"
                      style={{
                        background: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {product.warehouseName || "No Warehouse"}
                    </span>
                  </td>
                  <td>{product.marker}</td>
                  <td>{product.packages}</td>
                  <td>
                    {product.weight} {product.unit}
                  </td>
                  <td>
                    {product.price} {product.currency}
                  </td>
                  <td>
                    <span
                      className={`badge ${product.remainingWeight < product.weight * 0.2 ? "badge-danger" : "badge-success"}`}
                    >
                      {product.remainingWeight.toFixed(2)} {product.unit}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission("Inventory.Edit") && (
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(product)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {hasPermission("Inventory.Delete") && (
                        <button
                          className={`btn-icon btn-icon-danger ${product.isUsed ? "disabled" : ""}`}
                          onClick={() =>
                            !product.isUsed && handleDelete(product.id)
                          }
                          title={
                            product.isUsed
                              ? "Cannot delete: This product has sales or processing records"
                              : "Delete"
                          }
                          disabled={product.isUsed}
                          style={
                            product.isUsed
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
