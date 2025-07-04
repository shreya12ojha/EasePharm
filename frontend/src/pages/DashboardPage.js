"use client";

import { useState, useEffect } from "react";
import "./DashboardPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DashboardPageWithDB = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders
      const ordersResponse = await fetch(`${API_BASE_URL}/api/orders`);
      const ordersData = await ordersResponse.json();

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const statsData = await statsResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.orders);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }

      setError(null);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );

        // Refresh stats
        fetchDashboardData();
        alert(`Order ${orderId} status updated to ${newStatus}`);
      } else {
        alert(`Failed to update order: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "processing":
        return "status-processing";
      case "ready":
        return "status-ready";
      case "dispensed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="error-message">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="btn btn-primary">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>📊 Pharmacy Dashboard</h1>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>Total Orders</h3>
              <div className="stat-number">{stats.totalOrders}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Orders</h3>
              <div className="stat-number">{stats.pendingOrders}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed Orders</h3>
              <div className="stat-number">{stats.completedOrders}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Today&apos;s Orders</h3>
              <div className="stat-number">{stats.todayOrders}</div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-section">
          <h2>📋 All Orders ({orders.length})</h2>

          {orders.length === 0 ? (
            <div className="no-orders">
              <p>
                No orders found. Upload a prescription to create your first
                order!
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Patient</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>OCR Method</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.patientName}</td>
                      <td>{order.medication}</td>
                      <td>{order.dosage || "N/A"}</td>
                      <td>{order.quantity || 1}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="ocr-method">
                        {order.ocrMethod || "N/A"}
                        {order.confidence && (
                          <div className="confidence">
                            {Math.round(order.confidence * 100)}%
                          </div>
                        )}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {order.status === "pending" && (
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, "processing")
                              }
                              className="btn-small btn-primary"
                            >
                              Process
                            </button>
                          )}
                          {order.status === "processing" && (
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, "ready")
                              }
                              className="btn-small btn-success"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === "ready" && (
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, "dispensed")
                              }
                              className="btn-small btn-success"
                            >
                              Dispense
                            </button>
                          )}
                          {order.status !== "cancelled" &&
                            order.status !== "dispensed" && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order.id, "cancelled")
                                }
                                className="btn-small btn-danger"
                              >
                                Cancel
                              </button>
                            )}
                        </div>
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
  );
};

export default DashboardPageWithDB;
