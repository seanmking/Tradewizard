import React, { useState, useEffect } from 'react';

const ChecklistQuestion = ({ category, items, onSubmit }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  // Initialize all items to "No" (false)
  useEffect(() => {
    const initialState = Object.keys(items).reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {});
    setCheckedItems(initialState);
  }, [items]);

  const handleToggle = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSubmit = () => {
    // Check if all items have been toggled
    const allItemsAnswered = Object.keys(items).every(id => checkedItems[id] !== undefined);
    if (!allItemsAnswered) {
      alert('Please answer all items before submitting');
      return;
    }

    setIsComplete(true);
    // Convert checkedItems to a formatted response
    const response = Object.entries(checkedItems)
      .map(([id, value]) => `${items[id].description}: ${value ? 'Yes' : 'No'}`)
      .join(', ');
    onSubmit(response);
  };

  return (
    <div className="checklist-question bg-white rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
      <div className="space-y-4">
        {Object.entries(items).map(([id, item]) => (
          <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2 group relative">
              {item.required && (
                <span className="text-red-500 text-sm">*</span>
              )}
              <span className="text-gray-700">{item.description}</span>
              <div className="relative inline-block">
                <span className="ml-1 text-gray-400 cursor-help">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div className="absolute left-0 w-60 p-2 mt-1 text-sm text-white bg-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                  {item.info}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${!checkedItems[id] ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                No
              </span>
              <button
                onClick={() => !isComplete && handleToggle(id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  checkedItems[id] ? 'bg-blue-600' : 'bg-gray-300'
                } ${isComplete ? 'cursor-not-allowed opacity-60' : ''}`}
                disabled={isComplete}
                aria-checked={checkedItems[id]}
                role="switch"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checkedItems[id] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${checkedItems[id] ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                Yes
              </span>
            </div>
          </div>
        ))}
      </div>
      {!isComplete && (
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Submit Assessment
        </button>
      )}
    </div>
  );
};

export default ChecklistQuestion; 