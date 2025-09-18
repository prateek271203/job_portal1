import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5001/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5001/api/admin/users/stats/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data?.overview || null);
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User deleted successfully');
        fetchUsers();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete user');
        console.error('Delete error:', error);
      }
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
              const token = localStorage.getItem('adminToken');
        await axios.put(`http://localhost:5001/api/admin/users/${userId}`, {
          isActive: !currentStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Status update error:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h1>Users Management</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Users Management</h1>
        <p>Manage all registered users</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <div className="stat-value">{stats.activeUsers || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Verified Users</h3>
            <div className="stat-value">{stats.verifiedUsers || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Premium Users</h3>
            <div className="stat-value">{stats.premiumUsers || 0}</div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="premium">Premium</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.length > 0 ? users.map((user, index) => (
                <tr key={user._id || index}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                      </div>
                      <div>
                        <div className="user-name">
                          {user.firstName || ''} {user.lastName || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <span className={`role-badge ${user.role || 'user'}`}>
                      {user.role === 'user' ? 'User' : 
                       user.role === 'premium' ? 'Premium' : 
                       user.role === 'employer' ? 'Employer' : 
                       user.role === 'admin' ? 'Admin' : user.role || 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="action-btn edit"
                        title="Edit User"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="action-btn toggle"
                        onClick={() => user._id && handleStatusToggle(user._id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        disabled={!user._id}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => user._id && handleDeleteUser(user._id)}
                        title="Delete User"
                        disabled={!user._id}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!currentPage || currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage || 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!currentPage || !totalPages || currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
