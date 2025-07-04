"use client"

import { useState, useEffect } from "react"
import { FileText, Users, Package, Clock } from "lucide-react"

const DashboardPage = () => {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
  })

  useEffect(() => {
    // Mock data for demo
    const mockOrders = [
      {
        id: "ORD-001",
        patientName: "John Doe",
        medication: "Amoxicillin 500mg",
        dosage: "3 times daily",
        status: "pending",
        createdAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "ORD-002",
        patientName: "Jane Smith",
        medication: "Lisinopril 10mg",
        dosage: "Once daily",
        status: "completed",
        createdAt: "2024-01-15T09:15:00Z",
      },
      {
        id: "ORD-003",
        patientName: "Bob Johnson",
        medication: "Metformin 850mg",
        dosage: "Twice daily",
        status: "processing",
        createdAt: "2024-01-15T11:45:00Z",
      },
    ]

    setOrders(mockOrders)
    setStats({
      totalOrders: mockOrders.length,
      pendingOrders: mockOrders.filter((o) => o.status === "pending").length,
      completedOrders: mockOrders.filter((o) => o.status === "completed").length,
      todayOrders: mockOrders.length,
    })
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"
      case "processing":
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
      case "completed":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pharmacy Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold">{stats.todayOrders}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <p className="text-gray-600">Latest prescription orders processed</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.medication}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.dosage}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusColor(order.status)}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
