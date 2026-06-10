import React, { useEffect, useState } from "react";
import { placesAPI, purifiersAPI, warehousesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type {
  Place,
  CreatePlaceDto,
  Purifier,
  Warehouse,
  CreatePurifierDto,
  UpdatePurifierDto,
} from "../../types";
import {
  MapPin,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import "./index.css";

const PurifierManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [purifiers, setPurifiers] = useState<Purifier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [editingPurifier, setEditingPurifier] = useState<Purifier | null>(null);
  const [formData, setFormData] = useState<CreatePurifierDto>({
    name: "",
    warehouseId: 0,
  });
  const [placeFormData, setPlaceFormData] = useState<CreatePlaceDto>({
    name: "",
    warehouseId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [purifierData, warehouseData, placeData] = await Promise.all([
        purifiersAPI.getAll(),
        warehousesAPI.getAll(),
        placesAPI.getAll(),
      ]);
      setPurifiers(purifierData);
      setWarehouses(warehouseData);
      setPlaces(placeData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setPlaceFormData((prev) => ({
      ...prev,
      [name]: name === "warehouseId" ? parseInt(value) : value,
    }));
  };

  const handlePlaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await placesAPI.create(placeFormData);
      setPlaceFormData({ name: "", warehouseId: 0 });
      loadData();
    } catch (error) {
      console.error("Failed to save place:", error);
      alert("Failed to save place");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "warehouseId" || name === "placeId"
          ? value === "0"
            ? name === "placeId"
              ? undefined
              : 0
            : parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPurifier) {
        const updateDto: UpdatePurifierDto = {
          ...formData,
          isActive: editingPurifier.isActive,
        };
        await purifiersAPI.update(editingPurifier.id, updateDto);
      } else {
        await purifiersAPI.create(formData);
      }
      setShowModal(false);
      setEditingPurifier(null);
      setFormData({ name: "", warehouseId: 0 });
      loadData();
    } catch (error) {
      console.error("Failed to save purifier:", error);
      alert("Failed to save purifier");
    }
  };

  const handleEdit = (purifier: Purifier) => {
    setEditingPurifier(purifier);
    setFormData({
      name: purifier.name,
      warehouseId: purifier.warehouseId,
      placeId: purifier.placeId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this purifier?")) {
      try {
        await purifiersAPI.delete(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete purifier:", error);
      }
    }
  };

  const handleDeletePlace = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this place?")) {
      try {
        await placesAPI.delete(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete place:", error);
        alert("Failed to delete place");
      }
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="purifiers-container fade-in">
      <div className="page-header">
        <div className="header-info">
          <Users size={32} className="text-primary" />
          <div>
            <h1>Purifier Management</h1>
            <p>Manage purifiers and their assigned warehouses</p>
          </div>
        </div>
        {hasPermission("Warehouse.Create") && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-primary"
              style={{ backgroundColor: "#10b981" }}
              onClick={() => setShowPlaceModal(true)}
            >
              <MapPin size={20} />
              Register Place
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <UserPlus size={20} />
              Register Purifier
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purifiers.map((purifier) => (
                <tr key={purifier.id}>
                  <td style={{ fontWeight: 600 }}>{purifier.name}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <WarehouseIcon size={14} style={{ color: "#64748b" }} />
                      {purifier.warehouseName}{" "}
                      {purifier.placeName && (
                        <>
                          <MapPin
                            size={14}
                            style={{ color: "#64748b", marginLeft: "4px" }}
                          />
                          <span>{purifier.placeName}</span>
                        </>
                      )}{" "}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${purifier.isActive ? "badge-success" : "badge-danger"}`}
                    >
                      {purifier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      {hasPermission("Warehouse.Edit") && (
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(purifier)}
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {hasPermission("Warehouse.Delete") && (
                        <button
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(purifier.id)}
                        >
                          <Trash2 size={18} />
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

      {showPlaceModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>Register New Place</h2>
              <button
                className="btn-icon"
                onClick={() => {
                  setShowPlaceModal(false);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePlaceSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={placeFormData.name}
                  onChange={handlePlaceInputChange}
                  required
                  placeholder="Enter place name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Warehouse</label>
                <select
                  name="warehouseId"
                  className="form-select"
                  value={placeFormData.warehouseId}
                  onChange={handlePlaceInputChange}
                  required
                >
                  <option value="0">-- Select Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPlaceModal(false);
                  }}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={20} />
                  Register
                </button>
              </div>
            </form>

            <div className="mt-4">
              <h4>Registered Places</h4>
              {places.length === 0 ? (
                <p className="text-muted">No places registered yet.</p>
              ) : (
                <div
                  className="table-container"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Warehouse</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {places.map((place) => (
                        <tr key={place.id}>
                          <td>{place.name}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <WarehouseIcon
                                size={14}
                                style={{ color: "#64748b" }}
                              />
                              {place.warehouseName}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {hasPermission("Warehouse.Delete") && (
                              <button
                                className="btn-icon text-danger"
                                onClick={() => handleDeletePlace(place.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>
                {editingPurifier ? "Edit Purifier" : "Register New Purifier"}
              </h2>
              <button
                className="btn-icon"
                onClick={() => {
                  setShowModal(false);
                  setEditingPurifier(null);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter purifier name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Warehouse</label>
                <select
                  name="warehouseId"
                  className="form-select"
                  value={formData.warehouseId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="0">-- Select Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Place</label>
                <select
                  name="placeId"
                  className="form-select"
                  value={formData.placeId || "0"}
                  onChange={handleInputChange}
                  disabled={!formData.warehouseId}
                >
                  <option value="0">-- Select Place (Optional) --</option>
                  {places
                    .filter((p) => p.warehouseId === formData.warehouseId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPurifier(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={20} />
                  {editingPurifier ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurifierManagement;
