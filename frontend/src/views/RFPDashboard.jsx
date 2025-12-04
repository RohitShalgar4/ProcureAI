import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfpAPI, handleApiError } from '../services/api';
import Toast from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';

const RFPDashboard = () => {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState([]);
  const [filteredRfps, setFilteredRfps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [toast, setToast] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'receiving_proposals', label: 'Receiving Proposals' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    fetchRFPs();
  }, []);

  useEffect(() => {
    filterRFPs();
  }, [selectedStatus, rfps]);

  const fetchRFPs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await rfpAPI.getAll();
      setRfps(data.rfps || []);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      showToast(errorInfo.message, 'error');
      console.error('Failed to fetch RFPs:', errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRFPs = () => {
    if (selectedStatus === 'all') {
      setFilteredRfps(rfps);
    } else {
      setFilteredRfps(rfps.filter(rfp => rfp.status === selectedStatus));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleViewDetails = (rfpId) => {
    navigate(`/rfp/${rfpId}/comparison`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1';
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-300`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-300`;
      case 'receiving_proposals':
        return `${baseClasses} bg-yellow-100 text-yellow-700 border border-yellow-300`;
      case 'closed':
        return `${baseClasses} bg-green-100 text-green-700 border border-green-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-300`;
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Calculate stats
  const stats = {
    total: rfps.length,
    draft: rfps.filter(r => r.status === 'draft').length,
    sent: rfps.filter(r => r.status === 'sent').length,
    receiving: rfps.filter(r => r.status === 'receiving_proposals').length,
    closed: rfps.filter(r => r.status === 'closed').length,
  };

  return (
    <div className="container mx-auto px-4 py-8 page-enter">
      {/* Stats Grid */}
      {!isLoading && !error && rfps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-item">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total RFPs</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.receiving}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Sent</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.sent}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Closed</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.closed}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 stagger-item">
        <h1 className="text-3xl font-bold text-gray-900">RFP Dashboard</h1>
      </div>

      {/* Status Filter */}
      <div className="mb-6 stagger-item">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedStatus === option.value
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {option.label}
              {option.value !== 'all' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedStatus === option.value
                    ? 'bg-white/20'
                    : 'bg-gray-100'
                }`}>
                  {stats[option.value] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading RFPs...</p>
        </div>
      ) : error ? (
        <ErrorMessage
          message={error}
          title="Failed to Load RFPs"
          onRetry={fetchRFPs}
          onDismiss={() => setError(null)}
        />
      ) : filteredRfps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100 stagger-item">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4 float-animation">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedStatus === 'all' 
              ? 'No RFPs found' 
              : `No RFPs with status "${getStatusLabel(selectedStatus)}"`}
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'all' 
              ? 'Create your first RFP to get started' 
              : 'Try selecting a different status filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 stagger-item">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Proposals
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRfps.map((rfp, index) => {
                  // Use id or _id depending on what the backend returns
                  const rfpId = rfp.id || rfp._id;
                  return (
                    <tr 
                      key={rfpId} 
                      className="hover:bg-blue-50 cursor-pointer transition-all duration-150"
                      onClick={() => handleViewDetails(rfpId)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {rfp.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{rfp.title}</div>
                          {rfp.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {rfp.description.substring(0, 100)}
                              {rfp.description.length > 100 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(rfp.status)}>
                        {getStatusLabel(rfp.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(rfp.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {rfp.proposal_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(rfpId);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredRfps.length}</span> of <span className="font-semibold text-gray-900">{rfps.length}</span> RFPs
            </p>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default RFPDashboard;
