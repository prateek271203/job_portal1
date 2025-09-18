import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FiUsers,
  FiBriefcase,
  FiHome,
  FiFileText
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, chartsResponse] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/dashboard/charts')
      ]);

      setStats(statsResponse.data.data);
      setChartData(chartsResponse.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '12px', fontWeight: '700' }}>
          🎯 Admin Dashboard
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '32px' }}>
          Welcome back! Here's what's happening with your job portal today
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card floating">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: '#666', marginBottom: '8px', fontWeight: '600' }}>👥 Total Users</h3>
              <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: '700', color: '#667eea', marginBottom: '4px' }}>
                {stats?.overview?.totalUsers || 0}
              </div>
              <div className="stat-label" style={{ fontSize: '0.9rem', color: '#888' }}>Registered users</div>
            </div>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <FiUsers size={30} color="white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Total Jobs</h3>
              <div className="stat-value">{stats?.overview?.totalJobs || 0}</div>
              <div className="stat-label">Posted jobs</div>
            </div>
            <FiBriefcase size={40} color="#e74c3c" />
          </div>
        </div>

                        <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3>Total Companies</h3>
                      <div className="stat-value">{stats?.overview?.totalCompanies || 0}</div>
                      <div className="stat-label">Registered companies</div>
                    </div>
                    <FiHome size={40} color="#f39c12" />
                  </div>
                </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Total Applications</h3>
              <div className="stat-value">{stats?.overview?.totalApplications || 0}</div>
              <div className="stat-label">Job applications</div>
            </div>
            <FiFileText size={40} color="#27ae60" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Users Chart */}
        <div className="chart-card animate-slide-in">
          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>
            📈 User Registrations (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData?.users || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs Chart */}
        <div className="chart-card">
          <h3>Job Postings (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData?.jobs || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#e74c3c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="charts-section">
        {/* Job Categories */}
        <div className="chart-card">
          <h3>Jobs by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.analytics?.jobCategories || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(stats?.analytics?.jobCategories || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Roles */}
        <div className="chart-card">
          <h3>Users by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.analytics?.userRoles || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3>Recent Activity</h3>
        <div className="grid grid-2">
          <div>
            <h4>Recent Users</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {(stats?.recent?.users || []).map((user) => (
                <div key={user._id} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #ecf0f1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {user.email} • {user.role}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4>Recent Jobs</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {(stats?.recent?.jobs || []).map((job) => (
                <div key={job._id} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #ecf0f1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {job.company?.name} • {job.category}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
