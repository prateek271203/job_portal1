import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiSave, FiX, FiMove } from 'react-icons/fi';
import './Content.css';

const Content = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    section: '',
    title: '',
    content: '',
    image: '',
    order: 0
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/content');
      setContents(response.data.data);
    } catch (error) {
      toast.error('Failed to load content');
      console.error('Content error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/admin/content/${editingId}`, formData);
        toast.success('Content updated successfully');
      } else {
        await axios.post('/api/admin/content', formData);
        toast.success('Content created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchContents();
    } catch (error) {
      toast.error('Failed to save content');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (content) => {
    setEditingId(content._id);
    setFormData({
      section: content.section,
      title: content.title,
      content: content.content,
      image: content.image || '',
      order: content.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await axios.delete(`/api/admin/content/${id}`);
        toast.success('Content deleted successfully');
        fetchContents();
      } catch (error) {
        toast.error('Failed to delete content');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      section: '',
      title: '',
      content: '',
      image: '',
      order: 0
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="content-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="content-header">
        <h1 className="content-title">Content Management</h1>
        <p className="content-subtitle">Manage website content sections like About Us, Contact, etc.</p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="add-content-btn"
      >
        <FiPlus className="add-content-icon" />
        Add New Content
      </button>

      {/* Content Grid */}
      <div className="content-grid">
        {contents.map((content) => (
          <div key={content._id} className="content-card">
            <div className="content-header-card">
              <div className="content-section-badge">
                {content.section}
              </div>
              <div className="content-order">
                Order: {content.order}
              </div>
            </div>
            <div className="content-body">
              <h3 className="content-card-title">
                {content.title}
              </h3>
              <div className="content-preview">
                {content.content.substring(0, 150)}...
              </div>
              {content.image && (
                <div className="content-image-preview">
                  <img src={content.image} alt={content.title} />
                </div>
              )}
            </div>
            <div className="content-actions">
              <button
                onClick={() => handleEdit(content)}
                className="content-action-btn edit"
                title="Edit Content"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={() => handleDelete(content._id)}
                className="content-action-btn delete"
                title="Delete Content"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Content Form Modal */}
      {showForm && (
        <div className="content-form-modal">
          <div className="content-form-container">
            <div className="content-form-header">
              <h2 className="content-form-title">
                {editingId ? 'Edit Content' : 'Add New Content'}
              </h2>
              <button
                onClick={cancelEdit}
                className="close-btn"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="content-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Section *
                  </label>
                  <select
                    required
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Select Section</option>
                    <option value="about">About Us</option>
                    <option value="contact">Contact</option>
                    <option value="home">Home Page</option>
                    <option value="footer">Footer</option>
                    <option value="privacy">Privacy Policy</option>
                    <option value="terms">Terms of Service</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    className="form-input"
                    placeholder="Display order (0, 1, 2...)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  placeholder="Content title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Content *
                </label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="form-textarea"
                  placeholder="Enter the content text..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                >
                  <FiSave className="submit-icon" />
                  {editingId ? 'Update Content' : 'Create Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;
