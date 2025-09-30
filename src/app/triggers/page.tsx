'use client';

import { useState, useEffect } from 'react';
import { Structure } from '@/types';
import { useApp } from '@/hooks/useApp';
import { useTriggers } from '@/hooks/useTriggers';
import { StructureSearch, TriggerForm, TriggerList, TriggerExportImport } from '@/components/triggers';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export default function TriggersPage() {
  const { structures } = useApp();
  const {
    triggers,
    isLoading,
    createTrigger,
    createMembershipTrigger,
    createPermanenceTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTriggerActive,
    exportTriggers,
    importTriggers,
    getStatistics
  } = useTriggers();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const statistics = getStatistics();

  // Filter triggers based on search
  const filteredTriggers = triggers.filter(trigger => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const structure = (trigger.type === 'membership' || trigger.type === 'permanence') 
      ? structures.find(s => s.code === trigger.structureCode)
      : null;
    
    return (
      trigger.notificationConfig.title.toLowerCase().includes(query) ||
      trigger.notificationConfig.body.toLowerCase().includes(query) ||
      trigger.flowId.toLowerCase().includes(query) ||
      structure?.name.toLowerCase().includes(query) ||
      structure?.code.toLowerCase().includes(query)
    );
  });

  const handleCreateTrigger = () => {
    setSelectedStructure(null);
    setEditingTrigger(null);
    setViewMode('create');
  };

  const handleEditTrigger = (trigger: any) => {
    const structure = (trigger.type === 'membership' || trigger.type === 'permanence') 
      ? structures.find(s => s.code === trigger.structureCode)
      : null;
    setSelectedStructure(structure || null);
    setEditingTrigger(trigger);
    setViewMode('edit');
  };

  const handleSubmitTrigger = async (data: {
    type: 'membership' | 'permanence';
    triggerType?: 'enter' | 'exit';
    permanenceHours?: number;
    title: string;
    body: string;
    flowId: string;
  }) => {
    if (!selectedStructure) return;

    setIsSubmitting(true);
    try {
      if (editingTrigger) {
        updateTrigger(editingTrigger.id, {
          notificationConfig: {
            title: data.title,
            body: data.body
          },
          flowId: data.flowId
        });
      } else {
        if (data.type === 'membership' && data.triggerType) {
          createMembershipTrigger(
            selectedStructure.code,
            data.triggerType,
            data.title,
            data.body,
            data.flowId
          );
        } else if (data.type === 'permanence' && data.permanenceHours) {
          createPermanenceTrigger(
            selectedStructure.code,
            data.permanenceHours,
            data.title,
            data.body,
            data.flowId
          );
        }
      }
      setViewMode('list');
      setSelectedStructure(null);
      setEditingTrigger(null);
    } catch (error) {
      console.error('Failed to save trigger:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedStructure(null);
    setEditingTrigger(null);
  };

  const handleStructureSelect = (structure: Structure) => {
    setSelectedStructure(structure);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Navigation />
      
      {/* Sub-header for triggers page */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {viewMode !== 'list' && (
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedStructure(null);
                    setEditingTrigger(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Triggers
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {viewMode === 'list' ? 'Geofencing Triggers' : 
                   viewMode === 'create' ? 'Create New Trigger' : 'Edit Trigger'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {viewMode === 'list' 
                    ? 'Manage notifications and flows for structure entry/exit events'
                    : selectedStructure 
                      ? `Configure trigger for ${selectedStructure.name}`
                      : 'Choose a structure to configure the trigger'
                  }
                </p>
              </div>
            </div>
            
            {viewMode === 'list' && (
              <button
                onClick={handleCreateTrigger}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Trigger
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 128px)' }}>
        <div className="max-w-6xl mx-auto p-6 min-h-full">
          {viewMode === 'list' ? (
            <div className="space-y-6 pb-8"> {/* Add bottom padding for better scroll experience */}
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalTriggers}</div>
                  <div className="text-sm text-gray-600">Total Triggers</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{statistics.activeTriggers}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{statistics.structuresWithTriggers}</div>
                  <div className="text-sm text-gray-600">Structures</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.enterTriggers}/{statistics.exitTriggers}
                  </div>
                  <div className="text-sm text-gray-600">Enter/Exit</div>
                </div>
              </div>

              {/* Search */}
              {triggers.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search triggers by title, structure, or flow ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Triggers List */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  All Triggers
                  {filteredTriggers.length !== triggers.length && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredTriggers.length} of {triggers.length})
                    </span>
                  )}
                </h2>
                <TriggerList
                  triggers={filteredTriggers}
                  structures={structures}
                  onEditTrigger={handleEditTrigger}
                  onDeleteTrigger={deleteTrigger}
                  onToggleActive={toggleTriggerActive}
                />
              </div>

              {/* Export/Import */}
              <TriggerExportImport
                triggers={triggers}
                onImport={importTriggers}
                onExport={exportTriggers}
                statistics={statistics}
              />
            </div>
          ) : (
            <div className="space-y-6 pb-8"> 
              {/* Structure Selection */}
              {!selectedStructure && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Structure
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Choose the structure where you want to create a geofencing trigger.
                  </p>
                  <StructureSearch
                    structures={structures}
                    onStructureSelect={handleStructureSelect}
                    placeholder="Search for a structure..."
                  />
                </div>
              )}

              {/* Trigger Form */}
              {selectedStructure && (
                <TriggerForm
                  structure={selectedStructure}
                  existingTriggers={triggers}
                  onSubmit={handleSubmitTrigger}
                  editingTrigger={editingTrigger}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}