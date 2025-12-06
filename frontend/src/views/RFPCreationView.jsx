import { useState } from 'react';
import { rfpAPI, vendorAPI, handleApiError } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';

const RFPCreationView = () => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [structuredRFP, setStructuredRFP] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Vendor selection state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please enter a description for your RFP');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const data = await rfpAPI.create({ description });
      setStructuredRFP(data.rfp);
      showToast('RFP created successfully!');
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      showToast(errorInfo.message, 'error');
      console.error('Failed to create RFP:', errorInfo);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendRFP = async () => {
    try {
      setIsVendorModalOpen(true);
      setIsLoadingVendors(true);
      const data = await vendorAPI.getAll();
      setVendors(data.vendors || []);
    } catch (err) {
      const errorInfo = handleApiError(err);
      showToast(errorInfo.message, 'error');
      console.error('Failed to load vendors:', errorInfo);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleConfirmSend = async () => {
    if (selectedVendorIds.length === 0) {
      showToast('Please select at least one vendor', 'error');
      return;
    }

    try {
      setIsSending(true);
      // Use id or _id depending on what the backend returns
      const rfpId = structuredRFP.id || structuredRFP._id;

      if (!rfpId) {
        throw new Error('RFP ID is missing. Please create the RFP again.');
      }

      const result = await rfpAPI.send(rfpId, { vendor_ids: selectedVendorIds });
      const successCount = result.results?.successful || result.sent_count || 0;
      showToast(`RFP sent successfully to ${successCount} vendor(s)!`);
      setIsVendorModalOpen(false);
      setSelectedVendorIds([]);

      // Reset form after successful send
      setDescription('');
      setStructuredRFP(null);
    } catch (err) {
      const errorInfo = handleApiError(err);
      showToast(errorInfo.message, 'error');
      console.error('Failed to send RFP:', errorInfo);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewRFP = () => {
    setDescription('');
    setStructuredRFP(null);
    setError(null);
  };

  const formatStructuredData = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {data.items && data.items.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  {item.quantity && <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>}
                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p className="font-medium mb-1">Specifications:</p>
                      <ul className="list-disc list-inside pl-2 space-y-0.5">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.budget && (
          <div>
            <span className="font-semibold text-gray-700">Budget: </span>
            <span className="text-gray-900">${data.budget.toLocaleString()}</span>
          </div>
        )}

        {data.delivery_timeline && (
          <div>
            <span className="font-semibold text-gray-700">Delivery Timeline: </span>
            <span className="text-gray-900">{data.delivery_timeline}</span>
          </div>
        )}

        {data.payment_terms && (
          <div>
            <span className="font-semibold text-gray-700">Payment Terms: </span>
            <span className="text-gray-900">{data.payment_terms}</span>
          </div>
        )}

        {data.warranty_requirements && (
          <div>
            <span className="font-semibold text-gray-700">Warranty Requirements: </span>
            <span className="text-gray-900">{data.warranty_requirements}</span>
          </div>
        )}

        {data.special_conditions && data.special_conditions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Special Conditions:</h4>
            <ul className="list-disc list-inside space-y-1">
              {data.special_conditions.map((condition, index) => (
                <li key={index} className="text-gray-900">{condition}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create RFP</h1>
            <p className="text-gray-600 mt-1">
              Describe your procurement needs in natural language, and our AI will structure it into a professional RFP.
            </p>
          </div>
        </div>
      </div>

      {!structuredRFP ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <label htmlFor="description" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              RFP Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: We need to purchase 50 office chairs with ergonomic design and lumbar support, and 25 standing desks with electric height adjustment. Budget is $30,000 total. Need delivery within 45 days. Payment terms net 30. Minimum 2-year warranty required."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[240px] transition-all duration-200 resize-none"
                disabled={isGenerating}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {description.length} characters
              </div>
            </div>
            <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Tip:</strong> Include details about items needed, quantities, budget, delivery timeline, payment terms, and any special requirements for best results.
                </span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage
                message={error}
                title="Error Creating RFP"
                onRetry={() => handleSubmit({ preventDefault: () => { } })}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !description.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <div className="relative mr-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                </div>
                <span>AI is generating your RFP...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate RFP with AI
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{structuredRFP.title}</h2>
              <button
                onClick={handleNewRFP}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Create New RFP
              </button>
            </div>

            <div className="mb-4 pb-4 border-b">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Original Description</h3>
              <p className="text-gray-700">{structuredRFP.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Structured RFP Details</h3>
              {formatStructuredData(structuredRFP.structured_data)}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendRFP}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Send to Vendors
            </button>
          </div>
        </div>
      )}

      {/* Vendor Selection Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title="Select Vendors"
      >
        <div className="space-y-4">
          {isLoadingVendors ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No vendors available. Please add vendors first.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Select the vendors you want to send this RFP to:
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {vendors.map((vendor) => {
                  // Use id or _id depending on what the backend returns
                  const vendorId = vendor.id || vendor._id;
                  return (
                    <label
                      key={vendorId}
                      className="flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(vendorId)}
                        onChange={() => handleVendorToggle(vendorId)}
                        className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendor.email}</div>
                        {vendor.specialization && (
                          <div className="text-sm text-gray-500">{vendor.specialization}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  disabled={isSending || selectedVendorIds.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    `Send to ${selectedVendorIds.length} Vendor${selectedVendorIds.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
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

export default RFPCreationView;
