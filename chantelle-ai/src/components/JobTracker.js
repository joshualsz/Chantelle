// src/components/JobTracker.js - Updated with better error handling

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ExternalLink, Calendar, Building, Briefcase, TrendingUp } from 'lucide-react';
import { jobTrackingService, analyticsService } from '../services/firestoreService';

const JobTracker = ({ currentUser }) => {
  const [jobApplications, setJobApplications] = useState([]);
  const [jobStats, setJobStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    interviewed: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load job applications on component mount
  useEffect(() => {
    if (currentUser) {
      loadJobApplications();
    }
  }, [currentUser]);

  // Load job applications from Firestore with better error handling
  const loadJobApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading job applications for user:', currentUser.uid);
      
      // Try to load applications and stats
      const applications = await jobTrackingService.getUserJobApplications(currentUser.uid);
      console.log('Loaded applications:', applications);
      
      const stats = await jobTrackingService.getJobStats(currentUser.uid);
      console.log('Loaded stats:', stats);
      
      setJobApplications(applications);
      setJobStats(stats);
    } catch (error) {
      console.error('Error loading job applications:', error);
      setError(error.message);
      
      // Set empty state on error
      setJobApplications([]);
      setJobStats({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        interviewed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new job application
  const handleAddApplication = async (applicationData) => {
    try {
      console.log('Adding application:', applicationData);
      await jobTrackingService.addJobApplication(currentUser.uid, applicationData);
      await loadJobApplications(); // Reload data
      
      // Track activity
      await analyticsService.trackActivity(currentUser.uid, 'job_application_added', {
        company: applicationData.company,
        role: applicationData.role
      });
      
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding job application:', error);
      alert('Failed to add job application: ' + error.message);
    }
  };

  // Update job application
  const handleUpdateApplication = async (applicationId, updateData) => {
    try {
      await jobTrackingService.updateJobApplication(applicationId, updateData);
      await loadJobApplications(); // Reload data
      
      // Track activity
      await analyticsService.trackActivity(currentUser.uid, 'job_application_updated', {
        status: updateData.status
      });
      
      setEditingApplication(null);
    } catch (error) {
      console.error('Error updating job application:', error);
      alert('Failed to update job application: ' + error.message);
    }
  };

  // Delete job application
  const handleDeleteApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await jobTrackingService.deleteJobApplication(applicationId);
        await loadJobApplications(); // Reload data
        
        // Track activity
        await analyticsService.trackActivity(currentUser.uid, 'job_application_deleted');
      } catch (error) {
        console.error('Error deleting job application:', error);
        alert('Failed to delete job application: ' + error.message);
      }
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats Cards Component
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <Briefcase className="text-gray-600 mr-2" size={20} />
          <div>
            <p className="text-2xl font-bold text-gray-900">{jobStats.total}</p>
            <p className="text-sm text-gray-600">Total Applied</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <Calendar className="text-yellow-600 mr-2" size={20} />
          <div>
            <p className="text-2xl font-bold text-yellow-600">{jobStats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <TrendingUp className="text-blue-600 mr-2" size={20} />
          <div>
            <p className="text-2xl font-bold text-blue-600">{jobStats.interviewed}</p>
            <p className="text-sm text-gray-600">Interviewed</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <Building className="text-green-600 mr-2" size={20} />
          <div>
            <p className="text-2xl font-bold text-green-600">{jobStats.accepted}</p>
            <p className="text-sm text-gray-600">Accepted</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-red-600 rounded mr-2"></div>
          <div>
            <p className="text-2xl font-bold text-red-600">{jobStats.rejected}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Add/Edit Modal Component
  const ApplicationModal = ({ isEdit = false, application = null, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      role: application?.role || '',
      company: application?.company || '',
      status: application?.status || 'pending',
      dateApplied: application?.dateApplied ? application.dateApplied.split('T')[0] : new Date().toISOString().split('T')[0],
      jobUrl: application?.jobUrl || '',
      notes: application?.notes || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.role.trim() || !formData.company.trim()) {
        alert('Please fill in role and company');
        return;
      }
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">
            {isEdit ? 'Edit Job Application' : 'Add Job Application'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Frontend Developer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Google"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="interviewed">Interviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
              <input
                type="date"
                value={formData.dateApplied}
                onChange={(e) => setFormData({...formData, dateApplied: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
              <input
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Interview notes, contact info, etc."
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {isEdit ? 'Update' : 'Add'} Application
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <h3 className="font-bold">Error Loading Job Applications</h3>
              <p>{error}</p>
              <button 
                onClick={loadJobApplications}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Application Tracker</h1>
            <p className="text-gray-600">Track and manage your job applications</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Application</span>
          </button>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          
          {jobApplications.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 mb-4">No job applications tracked yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{application.role}</div>
                        {application.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {application.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-gray-900">{application.company}</span>
                          {application.jobUrl && (
                            <a
                              href={application.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-purple-600 hover:text-purple-700"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={application.status}
                          onChange={(e) => handleUpdateApplication(application.id, { status: e.target.value })}
                          className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(application.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.dateApplied).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingApplication(application)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(application.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <ApplicationModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddApplication}
          />
        )}

        {/* Edit Modal */}
        {editingApplication && (
          <ApplicationModal
            isEdit={true}
            application={editingApplication}
            onClose={() => setEditingApplication(null)}
            onSave={(data) => handleUpdateApplication(editingApplication.id, data)}
          />
        )}
      </div>
    </div>
  );
};

export default JobTracker;