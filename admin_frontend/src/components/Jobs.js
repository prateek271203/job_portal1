import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiSave, 
  FiX, 
  FiEye, 
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiBookOpen,
  FiStar,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiGlobe,
  FiMail,
  FiPhone,
  FiLink
} from 'react-icons/fi';
import './Jobs.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    skills: [],
    experience: '',
    education: '',
    isActive: true,
    isRemote: false,
    isUrgent: false,
    category: '',
    jobType: '',
    salaryRange: '',
    applicationDeadline: '',
    remoteWork: false,
    visaSponsorship: false,
    status: 'active'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    jobType: '',
    status: '',
    isAdminPosted: ''
  });

  const categories = [
    'Commerce', 'Telecommunications', 'Hotels & Tourism', 'Education', 
    'Financial Services', 'Media', 'Construction', 'Technology', 
    'Healthcare', 'Marketing'
  ];

  const jobTypes = ['Full time', 'Part time', 'Contract', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
  const educationLevels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Any'];

  useEffect(() => {
    fetchJobs();
  }, [pagination.currentPage, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await axios.get(`http://localhost:5001/api/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setJobs(response.data.data);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems
        }));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title || !formData.description || !formData.company || 
        !formData.category || !formData.jobType || !formData.location || !formData.salaryRange) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare data for backend - backend expects 'company' not 'companyId'
      const jobData = {
        title: formData.title,
        description: formData.description,
        company: formData.company, // Backend expects 'company' field
        category: formData.category,
        jobType: formData.jobType,
        location: formData.location,
        salaryRange: formData.salaryRange,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education,
        status: formData.status
      };

      const response = await axios.post('http://localhost:5001/api/admin/jobs', jobData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Job created successfully!');
        setShowForm(false);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create job');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare data for backend - backend expects 'company' not 'companyId'
      const jobData = {
        title: formData.title,
        description: formData.description,
        company: formData.company, // Backend expects 'company' field
        category: formData.category,
        jobType: formData.jobType,
        location: formData.location,
        salaryRange: formData.salaryRange,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education,
        status: formData.status
      };

      const response = await axios.put(`http://localhost:5001/api/admin/jobs/${editingId}`, jobData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Job updated successfully!');
        setEditingId(null);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to update job');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(`http://localhost:5001/api/admin/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          toast.success('Job deleted successfully!');
          fetchJobs();
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error('Failed to delete job');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await axios.patch(`http://localhost:5001/api/admin/jobs/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Job ${newStatus} successfully!`);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error toggling job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const startEdit = (job) => {
    setEditingId(job._id);
         setFormData({
       title: job.title || '',
       description: job.description || '',
       company: job.company || '',
       category: job.category || '',
       jobType: job.jobType || '',
       location: job.location || '',
       salaryRange: job.salaryRange || '',
       requirements: Array.isArray(job.requirements) ? job.requirements : [],
       responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
       skills: Array.isArray(job.skills) ? job.skills : [],
       experience: job.experience || '',
       education: job.education || '',
       status: job.status || 'active',
       benefits: Array.isArray(job.benefits) ? job.benefits : [],
       applicationDeadline: job.applicationDeadline || '',
       remoteWork: job.remoteWork || false,
       visaSponsorship: job.visaSponsorship || false,
       type: job.type || 'full-time',
       salary: job.salary || { min: '', max: '', currency: 'USD' },
       isActive: job.isActive !== undefined ? job.isActive : true,
       isRemote: job.isRemote || false,
       isUrgent: job.isUrgent || false
     });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      category: '',
      jobType: '',
      location: '',
      salaryRange: '',
      requirements: [],
      responsibilities: [],
      skills: [],
      experience: '',
      education: '',
      status: 'active',
      benefits: [],
      applicationDeadline: '',
      remoteWork: false,
      visaSponsorship: false,
      type: 'full-time',
      salary: {
        min: '',
        max: '',
        currency: 'USD'
      },
      isActive: true,
      isRemote: false,
      isUrgent: false
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleArrayInput = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      jobType: '',
      status: '',
      isAdminPosted: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  if (loading) {
    return (
      <div className="jobs-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      {/* Header */}
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title">
            Job Management
          </h1>
          <p className="jobs-subtitle">Manage all jobs posted on the portal</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="add-job-btn"
        >
          <FiPlus className="add-job-icon" />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Total Jobs</div>
            <div className="stat-icon">
              <FiBriefcase />
            </div>
          </div>
          <div className="stat-value">{pagination.totalItems}</div>
          <div className="stat-label">Posted jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Active Jobs</div>
            <div className="stat-icon">
              <FiEye />
            </div>
          </div>
          <div className="stat-value">{jobs.filter(job => job.status === 'active').length}</div>
          <div className="stat-label">Active listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Categories</div>
            <div className="stat-icon">
              <FiStar />
            </div>
          </div>
          <div className="stat-value">{categories.length}</div>
          <div className="stat-label">Job categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Companies</div>
            <div className="stat-icon">
              <FiGlobe />
            </div>
          </div>
          <div className="stat-value">-</div>
          <div className="stat-label">Manual entry</div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-section">
        <div className="search-filter-title">
          <div className="search-filter-icon">🔍</div>
          Search & Filters
        </div>
        <div className="search-filter-grid">
          <div className="search-box">
            <label>Search Jobs</label>
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs by title, location, or company..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="filter-box">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-box">
            <label>Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {jobTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="filter-box">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="filter-actions">
            <button
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              <FiRefreshCw className="clear-filters-icon" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Job Form */}
      {showForm && (
        <div className="job-form-modal">
          <div className="job-form-container">
            <div className="job-form-header">
              <div>
                <h2 className="job-form-title">
                  {editingId ? 'Edit Job' : 'Post New Job'}
                </h2>
                <p className="job-form-subtitle">Fill in the details below to create an attractive job posting</p>
              </div>
              <button
                onClick={cancelEdit}
                className="close-btn"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="job-form">
              {/* Basic Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <FiBriefcase className="section-icon" />
                  Basic Information
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., Senior React Developer"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., Google, Microsoft, Apple"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Job Type *
                    </label>
                    <select
                      required
                      value={formData.jobType}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">Select Job Type</option>
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location & Compensation Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <FiMapPin className="section-icon" />
                  Location & Compensation
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., New York, NY or Remote"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Salary Range *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.salaryRange}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryRange: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., $80,000 - $120,000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Experience Level
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      className="form-select"
                    >
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Education Level
                    </label>
                    <select
                      value={formData.education}
                      onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                      className="form-select"
                    >
                      {educationLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.remoteWork}
                        onChange={(e) => setFormData(prev => ({ ...prev, remoteWork: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Remote Work</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visaSponsorship}
                        onChange={(e) => setFormData(prev => ({ ...prev, visaSponsorship: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Visa Sponsorship</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Job Description Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <FiBookOpen className="section-icon" />
                  Job Description
                </h3>
                <div className="form-group">
                  <label className="form-label">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    placeholder="Provide a comprehensive description of the job including responsibilities, requirements, and what makes this role exciting..."
                  />
                </div>
              </div>

              {/* Requirements & Skills Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <FiUsers className="section-icon" />
                  Requirements & Skills
                </h3>
                
                                 {/* Requirements */}
                 <div className="form-group">
                   <label className="form-label">
                     Job Requirements
                   </label>
                   <div className="array-input-container">
                     <div className="array-input-wrapper">
                       <input
                         type="text"
                         placeholder="Add a requirement (e.g., 3+ years of experience in React)"
                         onKeyPress={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             handleArrayInput('requirements', e.target.value);
                             e.target.value = '';
                           }
                         }}
                         className="array-input"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const input = document.querySelector('input[placeholder*="requirement"]');
                           if (input.value.trim()) {
                             handleArrayInput('requirements', input.value);
                             input.value = '';
                           }
                         }}
                         className="add-btn"
                       >
                         Add
                       </button>
                     </div>
                     <div className="tag-container">
                       {formData.requirements.map((req, index) => (
                         <span
                           key={index}
                           className="tag requirement-tag"
                         >
                           {req}
                           <button
                             type="button"
                             onClick={() => removeArrayItem('requirements', index)}
                             className="remove-tag-btn"
                           >
                             <FiX />
                           </button>
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Responsibilities */}
                 <div className="form-group">
                   <label className="form-label">
                     Job Responsibilities
                   </label>
                   <div className="array-input-container">
                     <div className="array-input-wrapper">
                       <input
                         type="text"
                         placeholder="Add a responsibility (e.g., Lead development team, Code review)"
                         onKeyPress={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             handleArrayInput('responsibilities', e.target.value);
                             e.target.value = '';
                           }
                         }}
                         className="array-input"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const input = document.querySelector('input[placeholder*="responsibility"]');
                           if (input.value.trim()) {
                             handleArrayInput('responsibilities', input.value);
                             input.value = '';
                           }
                         }}
                         className="add-btn"
                       >
                         Add
                       </button>
                     </div>
                     <div className="tag-container">
                       {formData.responsibilities.map((resp, index) => (
                         <span
                           key={index}
                           className="tag responsibility-tag"
                         >
                           {resp}
                           <button
                             type="button"
                             onClick={() => removeArrayItem('responsibilities', index)}
                             className="remove-tag-btn"
                           >
                             <FiX />
                           </button>
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>

                {/* Skills */}
                <div className="form-group">
                  <label className="form-label">
                    Required Skills
                  </label>
                  <div className="array-input-container">
                    <div className="array-input-wrapper">
                      <input
                        type="text"
                        placeholder="Add a skill (e.g., JavaScript, React, Node.js)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleArrayInput('skills', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="array-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder*="skill"]');
                          if (input.value.trim()) {
                            handleArrayInput('skills', input.value);
                            input.value = '';
                          }
                        }}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                    <div className="tag-container">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="tag skill-tag"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('skills', index)}
                            className="remove-tag-btn"
                          >
                            <FiX />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <FiStar className="section-icon" />
                  Benefits & Perks
                </h3>
                <div className="form-group">
                  <label className="form-label">
                    Benefits & Perks
                  </label>
                  <div className="array-input-container">
                    <div className="array-input-wrapper">
                      <input
                        type="text"
                        placeholder="Add a benefit (e.g., Health insurance, 401k, Flexible hours)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleArrayInput('benefits', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="array-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder*="benefit"]');
                          if (input.value.trim()) {
                            handleArrayInput('benefits', input.value);
                            input.value = '';
                          }
                        }}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                    <div className="tag-container">
                      {formData.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="tag benefit-tag"
                        >
                          {benefit}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('benefits', index)}
                            className="remove-tag-btn"
                          >
                            <FiX />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
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
                  {editingId ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="jobs-table-container">
        <div className="table-header">
          <div className="table-title">
            <div className="table-icon">💼</div>
            All Jobs ({pagination.totalItems})
          </div>
        </div>

        <div className="table-wrapper">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Details</th>
                <th>Company</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <div className="job-info">
                      <div className="job-icon">
                        <FiBriefcase />
                      </div>
                      <div className="job-details">
                        <div className="job-title">
                          {job.title}
                        </div>
                        <div className="job-meta">
                          <span className="job-meta-item">
                            <FiMapPin />
                            {job.location}
                          </span>
                          <span className="job-meta-item">
                            <FiClock />
                            {job.jobType}
                          </span>
                          <span className="job-meta-item">
                            <FiDollarSign />
                            {job.salaryRange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="company-name">
                      {job.company || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {job.category}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => startEdit(job)}
                        className="action-btn edit"
                        title="Edit Job"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job._id, job.status)}
                        className={`action-btn toggle ${job.status === 'active' ? 'deactivate' : 'activate'}`}
                        title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="action-btn delete"
                        title="Delete Job"
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
      </div>
    </div>
  );
};

export default Jobs;
