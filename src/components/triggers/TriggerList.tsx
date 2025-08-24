'use client';

import { useState } from 'react';
import { GeofencingTrigger, Structure } from '@/types';
import { formatTriggerDisplay } from '@/utils/triggerUtils';
import { capitalizeStructureType } from '@/utils/structUtils';
import { formatDate } from '@/utils/formatters';

interface TriggerListProps {
  triggers: GeofencingTrigger[];
  structures: Structure[];
  onEditTrigger: (trigger: GeofencingTrigger) => void;
  onDeleteTrigger: (triggerId: string) => void;
  onToggleActive: (triggerId: string) => void;
  isLoading?: boolean;
}

export default function TriggerList({
  triggers,
  structures,
  onEditTrigger,
  onDeleteTrigger,
  onToggleActive,
  isLoading = false
}: TriggerListProps) {
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set());
  const [deletingTrigger, setDeletingTrigger] = useState<string | null>(null);

  const toggleExpanded = (triggerId: string) => {
    const newExpanded = new Set(expandedTriggers);
    if (newExpanded.has(triggerId)) {
      newExpanded.delete(triggerId);
    } else {
      newExpanded.add(triggerId);
    }
    setExpandedTriggers(newExpanded);
  };

  const handleDelete = async (triggerId: string) => {
    setDeletingTrigger(triggerId);
    try {
      onDeleteTrigger(triggerId);
    } finally {
      setDeletingTrigger(null);
    }
  };

  const getStructureForTrigger = (structureCode: string) => {
    return structures.find(s => s.code === structureCode);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h11M9 12h7M9 17h3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No triggers yet</h3>
        <p className="text-gray-500">Create your first geofencing trigger to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {triggers.map((trigger) => {
        const structure = getStructureForTrigger(trigger.structureCode);
        const displayInfo = formatTriggerDisplay(trigger);
        const isExpanded = expandedTriggers.has(trigger.id);
        const isDeleting = deletingTrigger === trigger.id;

        return (
          <div
            key={trigger.id}
            className={`border rounded-lg bg-white transition-all ${
              trigger.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Header */}
            <div className="p-4" onClick={() => toggleExpanded(trigger.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{displayInfo.typeIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {trigger.notificationConfig.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded ${displayInfo.statusColor} ${
                        trigger.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {displayInfo.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{displayInfo.typeLabel}</span>
                      {structure && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 truncate">
                            {structure.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(trigger.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Notification Details</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Title:</span>
                        <p className="text-sm text-gray-900">{trigger.notificationConfig.title}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Body:</span>
                        <p className="text-sm text-gray-900">{trigger.notificationConfig.body}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Configuration</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Flow ID:</span>
                        <code className="block text-sm font-mono text-green-600 bg-white px-2 py-1 rounded border">
                          {trigger.flowId}
                        </code>
                      </div>
                      {structure && (
                        <div>
                          <span className="text-xs text-gray-500">Structure:</span>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{structure.name}</span>
                            <span className="text-gray-500 ml-2">({structure.code})</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {capitalizeStructureType(structure.type)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(trigger.createdAt)}
                    {trigger.updatedAt !== trigger.createdAt && (
                      <span className="ml-2">• Updated: {formatDate(trigger.updatedAt)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleActive(trigger.id)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        trigger.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {trigger.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    <button
                      onClick={() => onEditTrigger(trigger)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(trigger.id)}
                      disabled={isDeleting}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Deleting
                        </div>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
