import React, { useEffect, useState } from "react";
import { singleDoubleDrawnWorkersAPI, warehousesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type {
  SingleDoubleDrawnWorker,
  Warehouse,
  CreateSingleDoubleDrawnWorkerDto,
  UpdateSingleDoubleDrawnWorkerDto,
} from "../../types";
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import "./index.css";

const SingleDoubleDrawnWorkerManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [SingleDoubleDrawnWorkers, setSingleDoubleDrawnWorkers] = useState<
    SingleDoubleDrawnWorker[]
  >([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSingleDoubleDrawnWorker, setEditingSingleDoubleDrawnWorker] =
    useState<SingleDoubleDrawnWorker | null>(null);
  const [formData, setFormData] = useState<CreateSingleDoubleDrawnWorkerDto>({
    name: "",
    warehouseId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [SingleDoubleDrawnWorkerData, warehouseData] = await Promise.all([
        singleDoubleDrawnWorkersAPI.getAll(),
        warehousesAPI.getAll(),
      ]);
      setSingleDoubleDrawnWorkers(SingleDoubleDrawnWorkerData);
      setWarehouses(warehouseData);
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
      [name]: name === "warehouseId" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSingleDoubleDrawnWorker) {
        const updateDto: UpdateSingleDoubleDrawnWorkerDto = {
          ...formData,
        };
        await singleDoubleDrawnWorkersAPI.update(
          editingSingleDoubleDrawnWorker.id,
          updateDto,
        );
      } else {
        await singleDoubleDrawnWorkersAPI.create(formData);
      }
      setShowModal(false);
      setEditingSingleDoubleDrawnWorker(null);
      setFormData({ name: "", warehouseId: 0 });
      loadData();
    } catch (error) {
      console.error("Failed to save SingleDoubleDrawnWorker:", error);
      alert("Failed to save SingleDoubleDrawnWorker");
    }
  };

  const handleEdit = (SingleDoubleDrawnWorker: SingleDoubleDrawnWorker) => {
    setEditingSingleDoubleDrawnWorker(SingleDoubleDrawnWorker);
    setFormData({
      name: SingleDoubleDrawnWorker.name,
      warehouseId: SingleDoubleDrawnWorker.warehouseId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this SingleDoubleDrawnWorker?",
      )
    ) {
      try {
        await singleDoubleDrawnWorkersAPI.delete(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete SingleDoubleDrawnWorker:", error);
      }
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="SingleDoubleDrawnWorkers-container fade-in">
      <div className="page-header">
        <div className="header-info">
          <Users size={32} className="text-primary" />
          <div>
            <h1>Single/Double Drawn Worker Registration</h1>
            <p>Manage workers and their assigned warehouses</p>
          </div>
        </div>
        {hasPermission("Warehouse.Create") && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <UserPlus size={20} />
            Register Worker
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Warehouse</th>

                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SingleDoubleDrawnWorkers.map((SingleDoubleDrawnWorker) => (
                <tr key={SingleDoubleDrawnWorker.id}>
                  <td style={{ fontWeight: 600 }}>
                    {SingleDoubleDrawnWorker.name}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <WarehouseIcon size={14} style={{ color: "#64748b" }} />
                      {SingleDoubleDrawnWorker.warehouseName}
                    </div>
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
                          onClick={() => handleEdit(SingleDoubleDrawnWorker)}
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {hasPermission("Warehouse.Delete") && (
                        <button
                          className="btn-icon text-danger"
                          onClick={() =>
                            handleDelete(SingleDoubleDrawnWorker.id)
                          }
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>
                {editingSingleDoubleDrawnWorker
                  ? "Edit SingleDoubleDrawnWorker"
                  : "Register New SingleDoubleDrawnWorker"}
              </h2>
              <button
                className="btn-icon"
                onClick={() => {
                  setShowModal(false);
                  setEditingSingleDoubleDrawnWorker(null);
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
                  placeholder="Enter SingleDoubleDrawnWorker name"
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSingleDoubleDrawnWorker(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={20} />
                  {editingSingleDoubleDrawnWorker ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleDoubleDrawnWorkerManagement;
