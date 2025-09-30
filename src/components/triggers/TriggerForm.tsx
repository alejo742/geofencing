'use client';

import { useState, useEffect } from 'react';
import { Structure, Trigger } from '@/types';
import { validateTriggerData, getCharacterCountInfo, VALIDATION_RULES, generateMembershipTriggerPreview, generatePermanenceTriggerPreview, hasDuplicateMembershipTrigger, hasDuplicatePermanenceTrigger, validatePermanenceHours } from '@/utils/triggerUtils';
import { capitalizeStructureType } from '@/utils/structUtils';

interface TriggerFormProps {
  structure: Structure;
  existingTriggers: Trigger[];
  onSubmit: (data: {
    type: 'membership' | 'permanence';
    triggerType?: 'enter' | 'exit';
    permanenceHours?: number;
    title: string;
    body: string;
    flowId: string;
  }) => void;
  editingTrigger?: Trigger;
  isSubmitting?: boolean;
}

export default function TriggerForm({
  structure,
  existingTriggers,
  onSubmit,
  editingTrigger,
  isSubmitting = false
}: TriggerFormProps) {
  const [selectedType, setSelectedType] = useState<'membership' | 'permanence'>(
    (editingTrigger?.type === 'membership' || editingTrigger?.type === 'permanence') 
      ? editingTrigger.type 
      : 'membership'
  );
  const [triggerType, setTriggerType] = useState<'enter' | 'exit'>(
    editingTrigger?.type === 'membership' ? editingTrigger.triggerType : 'enter'
  );
  const [permanenceHours, setPermanenceHours] = useState<number>(
    editingTrigger?.type === 'permanence' ? editingTrigger.permanenceHours : 2
  );
  const [title, setTitle] = useState(editingTrigger?.notificationConfig.title || '');
  const [body, setBody] = useState(editingTrigger?.notificationConfig.body || '');
  const [flowId, setFlowId] = useState(editingTrigger?.flowId || '');
  const [showPreview, setShowPreview] = useState(false);

  // Validation
  const validation = validateTriggerData(title, body, flowId, selectedType === 'permanence' ? permanenceHours : undefined);
  const hoursValidation = selectedType === 'permanence' ? validatePermanenceHours(permanenceHours) : { isValid: true, errors: {} };
  const titleInfo = getCharacterCountInfo(title, VALIDATION_RULES.title.maxLength);
  const bodyInfo = getCharacterCountInfo(body, VALIDATION_RULES.body.maxLength);
  
  // Check for duplicates
  const isDuplicate = selectedType === 'membership' 
    ? hasDuplicateMembershipTrigger(existingTriggers, structure.code, triggerType, editingTrigger?.id)
    : hasDuplicatePermanenceTrigger(existingTriggers, structure.code, permanenceHours, editingTrigger?.id);

  const isFormValid = validation.isValid && hoursValidation.isValid && !isDuplicate && 
    title.trim().length >= VALIDATION_RULES.title.minLength && 
    body.trim().length >= VALIDATION_RULES.body.minLength;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !isSubmitting) {
      onSubmit({
        type: selectedType,
        triggerType: selectedType === 'membership' ? triggerType : undefined,
        permanenceHours: selectedType === 'permanence' ? permanenceHours : undefined,
        title: title.trim(),
        body: body.trim(),
        flowId: flowId.trim()
      });
    }
  };

  const triggerPreview = selectedType === 'membership' 
    ? generateMembershipTriggerPreview(title, body, flowId, triggerType)
    : generatePermanenceTriggerPreview(title, body, flowId, permanenceHours);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 max-h-screen">
      {/* Main Form - Left side (2/4) */}
      <div className="lg:col-span-4 overflow-y-auto max-h-screen">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {editingTrigger ? 'Edit' : 'Create'} Geofencing Trigger
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{structure.name}</span>
              <span>•</span>
              <span>{structure.code}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {capitalizeStructureType(structure.type)}
              </span>
              {/* Show existing triggers count */}
              {(() => {
                const existingCount = existingTriggers.filter(t => 
                  (t.type === 'membership' || t.type === 'permanence') && 
                  t.structureCode === structure.code
                ).length;
                if (existingCount > 0) {
                  return (
                    <>
                      <span>•</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {existingCount} trigger{existingCount !== 1 ? 's' : ''} exist{existingCount === 1 ? 's' : ''}
                      </span>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trigger Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Trigger Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedType('membership')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedType === 'membership'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚪</span>
                    <div>
                      <div className="font-medium">Membership</div>
                      <div className="text-sm opacity-75">
                        Enter/exit based triggers
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('permanence')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedType === 'permanence'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <div className="font-medium">Permanence</div>
                      <div className="text-sm opacity-75">
                        Time-spent based triggers
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Membership Trigger Event Options */}
            {selectedType === 'membership' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Trigger Event
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTriggerType('enter')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      triggerType === 'enter'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'enter', editingTrigger?.id)
                          ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed opacity-75'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                    disabled={hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'enter', editingTrigger?.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚪➡️</span>
                      <div>
                        <div className="font-medium">On Enter</div>
                        <div className="text-sm opacity-75">
                          {hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'enter', editingTrigger?.id)
                            ? 'Already exists'
                            : 'When user enters structure'
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerType('exit')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      triggerType === 'exit'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'exit', editingTrigger?.id)
                          ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed opacity-75'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                    disabled={hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'exit', editingTrigger?.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚪⬅️</span>
                      <div>
                        <div className="font-medium">On Exit</div>
                        <div className="text-sm opacity-75">
                          {hasDuplicateMembershipTrigger(existingTriggers, structure.code, 'exit', editingTrigger?.id)
                            ? 'Already exists'
                            : 'When user leaves structure'
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                {isDuplicate && selectedType === 'membership' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Duplicate Trigger Detected
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          A "{triggerType}" trigger already exists for "{structure.name}". Each structure can have only one trigger per type (enter/exit).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Permanence Hours Input */}
            {selectedType === 'permanence' && (
              <div>
                <label htmlFor="permanenceHours" className="block text-sm font-medium text-gray-700 mb-2">
                  Permanence Hours
                </label>
                <input
                  type="number"
                  id="permanenceHours"
                  value={permanenceHours}
                  onChange={(e) => setPermanenceHours(Number(e.target.value))}
                  min="1"
                  max="24"
                  placeholder="e.g., 2"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                    validation.errors.permanenceHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validation.errors.permanenceHours && (
                  <p className="text-sm text-red-600 mt-1">{validation.errors.permanenceHours}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Trigger will fire when user has spent this many hours within the structure (1-24 hours)
                </p>
                {hasDuplicatePermanenceTrigger(existingTriggers, structure.code, permanenceHours, editingTrigger?.id) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Duplicate Permanence Trigger Detected
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          A permanence trigger for {permanenceHours} hour{permanenceHours !== 1 ? 's' : ''} already exists for "{structure.name}".
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Welcome to Baker Library!"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                  validation.errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={VALIDATION_RULES.title.maxLength}
              />
              <div className="mt-1 flex justify-between items-center">
                <div>
                  {validation.errors.title && (
                    <p className="text-sm text-red-600">{validation.errors.title}</p>
                  )}
                </div>
                <p className={`text-xs ${titleInfo.colorClass}`}>
                  {titleInfo.count}/{VALIDATION_RULES.title.maxLength}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be the main text users see in the notification
              </p>
            </div>

            {/* Notification Body */}
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Body
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g., Tap to see study spaces and current hours"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none ${
                  validation.errors.body ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={VALIDATION_RULES.body.maxLength}
              />
              <div className="mt-1 flex justify-between items-center">
                <div>
                  {validation.errors.body && (
                    <p className="text-sm text-red-600">{validation.errors.body}</p>
                  )}
                </div>
                <p className={`text-xs ${bodyInfo.colorClass}`}>
                  {bodyInfo.count}/{VALIDATION_RULES.body.maxLength}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Additional details shown below the title
              </p>
            </div>

            {/* Flow ID */}
            <div>
              <label htmlFor="flowId" className="block text-sm font-medium text-gray-700 mb-2">
                Dialog Flow ID
              </label>
              <input
                type="text"
                id="flowId"
                value={flowId}
                onChange={(e) => setFlowId(e.target.value)}
                placeholder="e.g., library_main_flow"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                  validation.errors.flowId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validation.errors.flowId && (
                <p className="mt-1 text-sm text-red-600">{validation.errors.flowId}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                The Dialogflow CX flow identifier that will be triggered
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {editingTrigger ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingTrigger ? 'Update Trigger' : 'Create Trigger'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Sidebar - Right side (2/4) */}
      <div className="lg:col-span-3">
        <div className="sticky top-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h4>
            
            {/* Notification Preview */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Notification</h5>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className="font-medium text-gray-900 text-sm">
                      {title || 'Notification Title'}
                    </h6>
                    <p className="text-sm text-gray-600 mt-1">
                      {body || 'Notification body text'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flow Trigger */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Flow Trigger</h5>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-blue-700 break-all">
                    {flowId || 'flow_id'}
                  </code>
                </div>
              </div>
            </div>

            {/* Trigger Info - Only show for membership triggers */}
            {selectedType === 'membership' && (
              <div>
                <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Trigger Event</h5>
                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-lg">
                    {triggerType === 'enter' ? '🚪➡️' : '🚪⬅️'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-purple-700">
                      {triggerType === 'enter' ? 'On Enter' : 'On Exit'}
                    </div>
                    <div className="text-xs text-purple-600">
                      Triggers when user {triggerType === 'enter' ? 'enters' : 'exits'} structure
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                {selectedType === 'membership' ? (
                  <>
                    When users <strong>{triggerType}</strong> "{structure.name}", they'll see the notification above and flow "<strong>{flowId || 'flow_id'}</strong>" will be triggered.
                  </>
                ) : (
                  <>
                    When users spend <strong>{permanenceHours} hour{permanenceHours !== 1 ? 's' : ''}</strong> in "{structure.name}", they'll see the notification above and flow "<strong>{flowId || 'flow_id'}</strong>" will be triggered.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
