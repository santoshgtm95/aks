import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { warehousesAPI } from "../../services/api";
import type { Warehouse, CreateWarehouseDto } from "../../types";
import Modal from "../../components/Modal";
import { useNotification } from "../../context/NotificationContext";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Warehouse as WarehouseIcon,
  Building2,
  Tag,
} from "lucide-react";
import "./index.css";

const WarehouseManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showConfirm, showAlert } = useNotification();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateWarehouseDto>({
    name: "",
    location: "",
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.getAll();
      setWarehouses(data);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await warehousesAPI.update(editingId, { ...formData, isActive: true });
      } else {
        await warehousesAPI.create(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", location: "" });
      loadWarehouses();
    } catch (error) {
      console.error("Failed to save warehouse:", error);
      showAlert(
        "Error",
        "Failed to save warehouse. Please try again.",
        "error",
      );
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setFormData({
      name: warehouse.name,
      location: warehouse.location || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm(
      "Confirm Delete",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await warehousesAPI.delete(id);
          loadWarehouses();
        } catch (error) {
          if (error instanceof Error && (error as any).response?.data) {
            showAlert("Cannot Delete", (error as any).response.data, "error");
          } else {
            showAlert("Error", "Failed to delete warehouse.", "error");
          }
        }
      },
    );
  };

  if (loading) {
    return (
      <div className="wh-loading">
        <div className="wh-spinner" />
        <span>Loading warehouses…</span>
      </div>
    );
  }

  return (
    <div className="wh-page">
      {/* ── Hero Header ── */}
      <div className="wh-hero">
        <div className="wh-hero-left">
          <div className="wh-hero-icon">
            <WarehouseIcon size={30} strokeWidth={1.8} />
          </div>
          <div className="wh-hero-text">
            <h1>Warehouse Management</h1>
            <p>Manage your storage locations and facilities</p>
          </div>
        </div>

        <div className="wh-hero-right">
          {hasPermission("Warehouse.Create") && (
            <button
              className="wh-create-btn"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", location: "" });
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Create Warehouse
            </button>
          )}
        </div>
      </div>

      {/* ── Warehouse Grid ── */}
      <div className="wh-grid">
        {warehouses.length === 0 ? (
          <div className="wh-empty">
            <div className="wh-empty-icon">
              <Building2 size={42} strokeWidth={1.5} />
            </div>
            <h3>No warehouses yet</h3>
            <p>
              Create your first warehouse to start managing storage locations.
            </p>
            {hasPermission("Warehouse.Create") && (
              <button
                className="wh-create-btn"
                style={{
                  display: "inline-flex",
                  color: "#667eea",
                  background: "#fff",
                  border: "1.5px solid #e0e7ff",
                }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", location: "" });
                  setIsModalOpen(true);
                }}
              >
                <Plus size={18} strokeWidth={2.5} />
                Create Warehouse
              </button>
            )}
          </div>
        ) : (
          warehouses.map((wh, idx) => (
            <div
              key={wh.id}
              className="wh-card"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="wh-card-accent" />
              <div className="wh-card-body">
                <div className="wh-card-top">
                  <div className="wh-card-icon-wrap">
                    <WarehouseIcon size={26} strokeWidth={1.8} />
                  </div>
                  <div className="wh-card-meta">
                    <h3 className="wh-card-name" title={wh.name}>
                      {wh.name}
                    </h3>
                    {wh.location ? (
                      <div className="wh-card-location">
                        <MapPin size={13} />
                        <span>{wh.location}</span>
                      </div>
                    ) : (
                      <div
                        className="wh-card-location"
                        style={{ color: "#cbd5e1" }}
                      >
                        <MapPin size={13} />
                        <span>No location set</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="wh-card-status">
                  <span className="wh-badge-active">Active</span>
                </div>

                <div className="wh-card-divider" />

                <div className="wh-card-actions">
                  {hasPermission("Warehouse.Edit") && (
                    <button
                      className="wh-btn-edit"
                      onClick={() => handleEdit(wh)}
                    >
                      <Edit2 size={15} />
                      Edit
                    </button>
                  )}
                  {hasPermission("Warehouse.Delete") && (
                    <button
                      className="wh-btn-delete"
                      title="Delete warehouse"
                      onClick={() => handleDelete(wh.id, wh.name)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Warehouse" : "Create Warehouse"}
        maxWidth="480px"
      >
        {/* Inner form banner */}
        <div className="wh-form-header">
          <div className="wh-form-header-icon">
            <WarehouseIcon size={22} strokeWidth={1.8} />
          </div>
          <div className="wh-form-header-text">
            <h3>{editingId ? "Edit Warehouse Details" : "New Warehouse"}</h3>
            <p>
              {editingId
                ? "Update the name or location below"
                : "Fill in the details to create a new storage location"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wh-form-group">
            <label className="wh-form-label">
              <Tag size={14} />
              Warehouse Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              className="wh-form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Main Warehouse"
              autoFocus
            />
          </div>

          <div className="wh-form-group">
            <label className="wh-form-label">
              <MapPin size={14} />
              Location / Description
            </label>
            <input
              type="text"
              name="location"
              className="wh-form-input"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g. Building A, Ground Floor"
            />
          </div>

          <div className="wh-form-actions">
            <button type="submit" className="wh-form-submit">
              {editingId ? "Update Warehouse" : "Create Warehouse"}
            </button>
            <button
              type="button"
              className="wh-form-cancel"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarehouseManagement;
