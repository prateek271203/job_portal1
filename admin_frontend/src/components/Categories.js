import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiSave, FiX, FiEye } from 'react-icons/fi';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    image: { url: '', alt: '' },
    order: 0,
    isActive: true
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    isActive: ''
  });

  useEffect(() => {
    fetchCategories();
  }, [pagination.currentPage, filters]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });
      
      const response = await axios.get(`http://localhost:5001/api/admin/categories?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCategories(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5001/api/admin/categories', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Category created successfully');
      setShowForm(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`http://localhost:5001/api/admin/categories/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Category updated successfully');
      setEditingId(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5001/api/admin/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`http://localhost:5001/api/admin/categories/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to toggle category status');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      icon: item.icon || '',
      color: item.color || '#3B82F6',
      image: item.image || { url: '', alt: '' },
      order: item.order || 0,
      isActive: item.isActive
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      image: { url: '', alt: '' },
      order: 0,
      isActive: true
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (loading) {
    return (
      <div className="categories-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="categories-title">Category Management</h1>
        <p className="categories-subtitle">Manage job categories and their properties</p>
        <button
          onClick={() => setShowForm(true)}
          className="add-category-btn"
        >
          <FiPlus className="add-category-icon" />
          Add Category
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-section">
        <div className="search-filter-title">
          <div className="search-filter-icon">🔍</div>
          Search & Filter Categories
        </div>
        <div className="search-filter-grid">
          <div className="search-box">
            <label>Search Categories</label>
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <label>Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="filter-actions">
            <button
              onClick={() => {
                setFilters({ search: '', isActive: '' });
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="clear-filters-btn"
            >
              <span className="clear-filters-icon">🔄</span>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Category Form */}
      {(showForm || editingId) && (
        <div className="category-form-container">
          <div className="category-form-header">
            <h2 className="category-form-title">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="category-form-subtitle">
              Configure category details and appearance
            </p>
          </div>
          
          <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleSubmit} className="category-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📝</span>
                Basic Information
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({ 
                        ...formData, 
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    className="form-input"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="form-input"
                    placeholder="e.g., technology, healthcare, finance"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="form-input"
                    placeholder="0, 1, 2..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Status
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="form-checkbox"
                    />
                    <span>Active Category</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Appearance & Styling */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">🎨</span>
                Appearance & Styling
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Icon Class
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="form-input"
                    placeholder="e.g., fi-briefcase, fi-heart, fi-star"
                  />
                  <small className="form-help">Use Feather Icons class names</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Theme Color
                  </label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="color-picker"
                    />
                    <span className="color-preview" style={{ backgroundColor: formData.color }}>
                      {formData.color}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Media */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📄</span>
                Content & Media
              </h3>
              <div className="form-group">
                <label className="form-label">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="form-textarea"
                  placeholder="Describe what this category represents..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category Image URL
                </label>
                <input
                  type="url"
                  value={formData.image.url}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    image: { ...formData.image, url: e.target.value }
                  })}
                  className="form-input"
                  placeholder="https://example.com/category-image.jpg"
                />
                <small className="form-help">Optional: Add an image to represent this category</small>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={editingId ? cancelEdit : () => setShowForm(false)}
                className="cancel-btn"
              >
                <FiX className="cancel-icon" />
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
              >
                <FiSave className="submit-icon" />
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="categories-table-container">
        <div className="table-header">
          <div className="table-title">
            <div className="table-icon">🏷️</div>
            All Categories ({pagination.totalItems})
          </div>
        </div>
        
        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3 className="empty-title">No Categories Found</h3>
            <p className="empty-description">Create your first category to get started!</p>
            <button
              onClick={() => setShowForm(true)}
              className="empty-action-btn"
            >
              <FiPlus />
              Add First Category
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Jobs</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>
                        <div className="category-info">
                          {category.icon && (
                            <div 
                              className="category-icon"
                              style={{ backgroundColor: category.color }}
                            >
                              <i className={category.icon}></i>
                            </div>
                          )}
                          <div className="category-details">
                            <div className="category-name">{category.name}</div>
                            <div className="category-slug">{category.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="category-description">
                          {category.description || 'No description'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="job-count">
                          {category.jobCount || 0}
                        </div>
                      </td>
                      <td>
                        <div className="category-order">
                          {category.order}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => startEdit(category)}
                            className="action-btn edit"
                            title="Edit Category"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(category._id, category.isActive)}
                            className={`action-btn toggle ${category.isActive ? 'deactivate' : 'activate'}`}
                            title={category.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="action-btn delete"
                            title="Delete Category"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;
