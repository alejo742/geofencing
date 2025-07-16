import React, { useEffect, useRef } from 'react';

interface ActionTooltipProps {
  title: string;
  message?: string;
  actionData?: {
    acceptText?: string;
    cancelText?: string;
    onAccept?: () => void;
    onCancel?: () => void;
  };
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  title,
  message,
  actionData
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        actionData?.onCancel?.();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionData]);
  
  return (
    <div 
      ref={tooltipRef} 
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-64"
    >
      <div className="p-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        <div className="mt-3 flex justify-end space-x-2">
          {actionData?.cancelText && actionData.onCancel && (
            <button
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
              onClick={actionData.onCancel}
            >
              {actionData.cancelText}
            </button>
          )}
          {actionData?.acceptText && actionData.onAccept && (
            <button
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
              onClick={actionData.onAccept}
            >
              {actionData.acceptText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Also add a default export if needed
export default ActionTooltip;