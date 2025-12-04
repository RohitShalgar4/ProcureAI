import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proposalAPI, handleApiError } from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ErrorMessage from '../components/ErrorMessage';

const ProposalComparisonView = () => {
  const { id: rfpId } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Modal states
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    if (rfpId) {
      fetchProposals();
      fetchComparison();
    }
  }, [rfpId]);

  const fetchProposals = async () => {
    try {
      setIsLoadingProposals(true);
      setError(null);
      const data = await proposalAPI.getByRFP(rfpId);
      setProposals(data.proposals || []);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      showToast(errorInfo.message, 'error');
      console.error('Failed to fetch proposals:', errorInfo);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  const fetchComparison = async () => {
    try {
      setIsLoadingComparison(true);
      const data = await proposalAPI.getComparison(rfpId);
      setComparison(data);
    } catch (err) {
      const errorInfo = handleApiError(err);
      showToast(errorInfo.message, 'error');
      console.error('Failed to fetch AI comparison:', errorInfo);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
    setIsDetailModalOpen(true);
  };

  const handleViewEmail = (proposal) => {
    setSelectedProposal(proposal);
    setIsEmailModalOpen(true);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `$${amount.toLocaleString()}`;
  };

  const getConfidenceBadge = (confidence) => {
    if (!confidence && confidence !== 0) return null;
    
    const percentage = Math.round(confidence * 100);
    let colorClass = 'bg-gray-200 text-gray-800';
    
    if (confidence >= 0.8) {
      colorClass = 'bg-green-200 text-green-800';
    } else if (confidence >= 0.6) {
      colorClass = 'bg-yellow-200 text-yellow-800';
    } else {
      colorClass = 'bg-red-200 text-red-800';
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
        {percentage}% confidence
      </span>
    );
  };

  if (isLoadingProposals) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && proposals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/rfp-dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <ErrorMessage
          message={error}
          title="Failed to Load Proposals"
          onRetry={fetchProposals}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/rfp-dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No proposals received yet for this RFP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/rfp-dashboard')}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Proposal Comparison</h1>

      {/* AI Recommendation Section */}
      {isLoadingComparison ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800 font-medium">AI is analyzing proposals...</span>
          </div>
        </div>
      ) : comparison?.recommendation ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-bold text-blue-900 mb-2">AI Recommendation</h2>
              <p className="text-lg font-semibold text-blue-800 mb-3">
                Recommended Vendor: {comparison.recommendation.vendor_name}
              </p>
              <p className="text-gray-700 leading-relaxed">{comparison.recommendation.reasoning}</p>
              {comparison.recommendation.confidence && (
                <div className="mt-3">
                  {getConfidenceBadge(comparison.recommendation.confidence)}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Comparison Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((proposal) => {
                const isRecommended = comparison?.recommendation?.vendor_id === proposal.vendor_id?._id;
                return (
                  <tr 
                    key={proposal._id}
                    className={`hover:bg-gray-50 ${isRecommended ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.vendor_id?.name || 'Unknown Vendor'}
                            {isRecommended && (
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {proposal.vendor_id?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(proposal.parsed_data?.total_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {proposal.parsed_data?.delivery_timeline || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {proposal.parsed_data?.payment_terms || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {proposal.parsed_data?.warranty_terms || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(proposal)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleViewEmail(proposal)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View Email
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Proposal Details"
        size="lg"
      >
        {selectedProposal && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Vendor Information</h3>
              <p className="text-sm"><span className="font-medium">Name:</span> {selectedProposal.vendor_id?.name}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {selectedProposal.vendor_id?.email}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Parsing Information</h3>
              <div className="flex items-center space-x-3">
                {getConfidenceBadge(selectedProposal.parsing_confidence)}
                {selectedProposal.requires_review && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-200 text-orange-800">
                    Requires Review
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Pricing Details</h3>
              {selectedProposal.parsed_data?.line_items && selectedProposal.parsed_data.line_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProposal.parsed_data.line_items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{item.item_name || '-'}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity || '-'}</td>
                          <td className="px-4 py-2 text-sm">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No line items available</p>
              )}
              <div className="mt-3 pt-3 border-t">
                <p className="text-lg font-bold">Total: {formatCurrency(selectedProposal.parsed_data?.total_price)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Delivery Timeline:</span> {selectedProposal.parsed_data?.delivery_timeline || '-'}</p>
                <p><span className="font-medium">Payment Terms:</span> {selectedProposal.parsed_data?.payment_terms || '-'}</p>
                <p><span className="font-medium">Warranty:</span> {selectedProposal.parsed_data?.warranty_terms || '-'}</p>
              </div>
            </div>

            {selectedProposal.parsed_data?.special_conditions && selectedProposal.parsed_data.special_conditions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Special Conditions</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedProposal.parsed_data.special_conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProposal.parsed_data?.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-700">{selectedProposal.parsed_data.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleViewEmail(selectedProposal);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Original Email →
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Original Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Original Email"
        size="lg"
      >
        {selectedProposal && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm mb-1"><span className="font-medium">From:</span> {selectedProposal.raw_email_content?.from || 'N/A'}</p>
              <p className="text-sm mb-1"><span className="font-medium">Subject:</span> {selectedProposal.raw_email_content?.subject || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">Received:</span> {selectedProposal.received_at ? new Date(selectedProposal.received_at).toLocaleString() : 'N/A'}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Email Body</h3>
              <div className="bg-white border border-gray-200 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedProposal.raw_email_content?.body || 'No email content available'}
                </pre>
              </div>
            </div>

            {selectedProposal.raw_email_content?.attachments && selectedProposal.raw_email_content.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                <ul className="list-disc list-inside text-sm">
                  {selectedProposal.raw_email_content.attachments.map((attachment, index) => (
                    <li key={index}>{attachment}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  setIsEmailModalOpen(false);
                  handleViewDetails(selectedProposal);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Parsed Details
              </button>
            </div>
          </div>
        )}
      </Modal>

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

export default ProposalComparisonView;
