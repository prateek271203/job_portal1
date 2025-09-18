import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiSave, FiEye } from 'react-icons/fi';
import './FAQs.css';

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    tags: [],
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
    seoTitle: '',
    metaDescription: '',
    keywords: []
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5001/api/admin/faqs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      
      if (editingId) {
        // Update existing FAQ
        const response = await axios.put(`http://localhost:5001/api/admin/faqs/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ updated successfully');
      } else {
        // Add new FAQ
        const response = await axios.post('http://localhost:5001/api/admin/faqs', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ created successfully');
      }
      
      fetchFAQs(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    }
  };



  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5001/api/admin/faqs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ deleted successfully');
        fetchFAQs(); // Refresh the list
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast.error('Failed to delete FAQ');
      }
    }
  };

  const handleEdit = (faq) => {
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      tags: faq.tags || [],
      isActive: faq.isActive !== undefined ? faq.isActive : true,
      isFeatured: faq.isFeatured || false,
      sortOrder: faq.sortOrder || 0,
      seoTitle: faq.seoTitle || '',
      metaDescription: faq.metaDescription || '',
      keywords: faq.keywords || []
    });
    setEditingId(faq._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      tags: [],
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
      seoTitle: '',
      metaDescription: '',
      keywords: []
    });
    setEditingId(null);
    setShowForm(false);
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && faq.isActive) ||
                         (filterStatus === 'inactive' && !faq.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="faqs-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faqs-container">
      {/* Header */}
      <div className="faqs-header">
        <div className="header-content">
          <h1 className="header-title">FAQ Management</h1>
          <p className="header-subtitle">Manage frequently asked questions and help content</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="add-faq-btn"
        >
          <FiPlus className="btn-icon" />
          Add New FAQ
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* FAQ Form */}
      {(showForm || editingId) && (
        <div className="faq-form-container">
          <div className="faq-form-header">
            <h2 className="faq-form-title">
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <p className="faq-form-subtitle">
              Create helpful content for your users
            </p>
          </div>

          <form onSubmit={handleSubmit} className="faq-form">
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">❓</span>
                Question & Answer
              </h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="form-input"
                    placeholder="Enter the frequently asked question"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">
                    Answer *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    className="form-textarea"
                    placeholder="Provide a clear and helpful answer"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">🏷️</span>
                Categorization & Settings
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="form-select"
                  >
                    <option value="General">General</option>
                    <option value="Job Search">Job Search</option>
                    <option value="Applications">Applications</option>
                    <option value="Company">Company</option>
                    <option value="Technical">Technical</option>
                    <option value="Payment">Payment</option>
                    <option value="Account">Account</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Status
                  </label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="toggle-input"
                    />
                    <label htmlFor="isActive" className="toggle-label">
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-text">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Featured
                  </label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="toggle-input"
                    />
                    <label htmlFor="isFeatured" className="toggle-label">
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-text">
                      {formData.isFeatured ? 'Featured' : 'Not Featured'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">🔖</span>
                Tags
              </h3>
              <div className="form-group full-width">
                <label className="form-label">
                  Tags
                </label>
                <div className="tags-input-container">
                  <div className="tags-display">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="remove-tag-btn"
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="tag-input-group">
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                      className="tag-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={resetForm}
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
                {editingId ? 'Update FAQ' : 'Create FAQ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs List */}
      <div className="faqs-list">
        {filteredFAQs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❓</div>
            <h3>No FAQs Found</h3>
            <p>Create your first FAQ to help your users</p>
            <button
              onClick={() => setShowForm(true)}
              className="empty-action-btn"
            >
              <FiPlus className="btn-icon" />
              Add FAQ
            </button>
          </div>
        ) : (
          <div className="faqs-grid">
            {filteredFAQs.map((faq) => (
              <div key={faq._id} className="faq-card">
                <div className="faq-header">
                  <div className="faq-meta">
                    <span className={`category-badge`}>
                      {faq.category}
                    </span>
                    <span className={`status-badge ${faq.isActive ? 'active' : 'inactive'}`}>
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {faq.isFeatured && (
                      <span className="featured-badge">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="faq-actions">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="action-btn edit-btn"
                      title="Edit FAQ"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="action-btn delete-btn"
                      title="Delete FAQ"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="faq-content">
                  <h3 className="faq-question">{faq.question}</h3>
                  <p className="faq-answer">{faq.answer}</p>
                  {faq.category && (
                    <div className="faq-category">
                      <span className="category-label">Category:</span>
                      <span className="category-value">{faq.category}</span>
                    </div>
                  )}
                  {faq.tags.length > 0 && (
                    <div className="faq-tags">
                      {faq.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="faq-footer">
                  <span className="faq-date">
                    Created: {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQs;
