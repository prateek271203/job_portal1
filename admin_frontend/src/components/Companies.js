import React from 'react';
import './Companies.css';

const Companies = () => {
  return (
    <div className="companies-container">
      <div className="companies-header">
        <h1 className="companies-title">Company Management</h1>
        <p className="companies-subtitle">Manage all companies on the portal</p>
      </div>
      
      <button className="add-company-btn">
        <span className="add-company-icon">🏢</span>
        Add New Company
      </button>

      <div className="search-filter-section">
        <div className="search-filter-title">
          <div className="search-filter-icon">🔍</div>
          Search & Filter Companies
        </div>
        <div className="search-filter-grid">
          <div className="search-box">
            <label>Search Companies</label>
            <input
              type="text"
              placeholder="Search by name, industry, or location..."
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <label>Industry</label>
            <select className="filter-select">
              <option value="">All Industries</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div className="filter-box">
            <label>Status</label>
            <select className="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-actions">
            <button className="clear-filters-btn">
              <span className="clear-filters-icon">🔄</span>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="companies-grid">
        <div className="company-card">
          <div className="company-header">
            <div className="company-logo">T</div>
            <div className="company-name">TechCorp Solutions</div>
            <div className="company-industry">Technology</div>
          </div>
          <div className="company-content">
            <div className="company-description">
              Leading technology company specializing in innovative software solutions for businesses worldwide.
            </div>
            <div className="company-details">
              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <span>San Francisco, CA</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🌐</span>
                <span>techcorp.com</span>
              </div>
            </div>
            <div className="company-stats">
              <div className="stat-item">
                <div className="stat-value">150+</div>
                <div className="stat-label">Employees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4.8</div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">25</div>
                <div className="stat-label">Jobs</div>
              </div>
            </div>
            <div className="company-actions">
              <button className="company-action-btn edit">Edit</button>
              <button className="company-action-btn toggle">Toggle</button>
              <button className="company-action-btn delete">Delete</button>
            </div>
          </div>
        </div>

        <div className="company-card">
          <div className="company-header">
            <div className="company-logo">H</div>
            <div className="company-name">HealthFirst Inc</div>
            <div className="company-industry">Healthcare</div>
          </div>
          <div className="company-content">
            <div className="company-description">
              Dedicated to improving healthcare outcomes through innovative medical technologies and patient care solutions.
            </div>
            <div className="company-details">
              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <span>Boston, MA</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🌐</span>
                <span>healthfirst.com</span>
              </div>
            </div>
            <div className="company-stats">
              <div className="stat-item">
                <div className="stat-value">300+</div>
                <div className="stat-label">Employees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4.9</div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">18</div>
                <div className="stat-label">Jobs</div>
              </div>
            </div>
            <div className="company-actions">
              <button className="company-action-btn edit">Edit</button>
              <button className="company-action-btn toggle">Toggle</button>
              <button className="company-action-btn delete">Delete</button>
            </div>
          </div>
        </div>

        <div className="company-card">
          <div className="company-header">
            <div className="company-logo">F</div>
            <div className="company-name">FinancePro Group</div>
            <div className="company-industry">Finance</div>
          </div>
          <div className="company-content">
            <div className="company-description">
              Comprehensive financial services company offering investment, banking, and wealth management solutions.
            </div>
            <div className="company-details">
              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <span>New York, NY</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🌐</span>
                <span>financepro.com</span>
              </div>
            </div>
            <div className="company-stats">
              <div className="stat-item">
                <div className="stat-value">500+</div>
                <div className="stat-label">Employees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4.7</div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">32</div>
                <div className="stat-label">Jobs</div>
              </div>
            </div>
            <div className="company-actions">
              <button className="company-action-btn edit">Edit</button>
              <button className="company-action-btn toggle">Toggle</button>
              <button className="company-action-btn delete">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Companies;
