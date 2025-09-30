import { Trigger } from '@/types';

// Validation constants
export const VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 50
  },
  body: {
    minLength: 3,
    maxLength: 100
  },
  flowId: {
    required: true,
    pattern: /^[a-zA-Z0-9_-]+$/ // Allow alphanumeric, underscore, and hyphen
  },
  permanenceHours: {
    min: 1,
    max: 24
  }
} as const;

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    body?: string;
    flowId?: string;
    permanenceHours?: string;
  };
}

// Validate notification config
export function validateNotificationConfig(title: string, body: string): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  // Validate title
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < VALIDATION_RULES.title.minLength) {
    errors.title = `Title must be at least ${VALIDATION_RULES.title.minLength} characters long`;
  } else if (trimmedTitle.length > VALIDATION_RULES.title.maxLength) {
    errors.title = `Title must be no more than ${VALIDATION_RULES.title.maxLength} characters long`;
  }

  // Validate body
  const trimmedBody = body.trim();
  if (trimmedBody.length < VALIDATION_RULES.body.minLength) {
    errors.body = `Body must be at least ${VALIDATION_RULES.body.minLength} characters long`;
  } else if (trimmedBody.length > VALIDATION_RULES.body.maxLength) {
    errors.body = `Body must be no more than ${VALIDATION_RULES.body.maxLength} characters long`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validate flow ID
export function validateFlowId(flowId: string): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  const trimmedFlowId = flowId.trim();
  if (!trimmedFlowId) {
    errors.flowId = 'Flow ID is required';
  } else if (!VALIDATION_RULES.flowId.pattern.test(trimmedFlowId)) {
    errors.flowId = 'Flow ID can only contain letters, numbers, underscores, and hyphens';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validate permanence hours
export function validatePermanenceHours(hours: number): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (hours < VALIDATION_RULES.permanenceHours.min) {
    errors.flowId = `Permanence hours must be at least ${VALIDATION_RULES.permanenceHours.min}`;
  } else if (hours > VALIDATION_RULES.permanenceHours.max) {
    errors.flowId = `Permanence hours must be no more than ${VALIDATION_RULES.permanenceHours.max}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validate complete trigger data
export function validateTriggerData(
  title: string,
  body: string,
  flowId: string,
  permanenceHours?: number
): ValidationResult {
  const notificationResult = validateNotificationConfig(title, body);
  const flowIdResult = validateFlowId(flowId);
  const permanenceResult = permanenceHours !== undefined ? validatePermanenceHours(permanenceHours) : { isValid: true, errors: {} };

  return {
    isValid: notificationResult.isValid && flowIdResult.isValid && permanenceResult.isValid,
    errors: {
      ...notificationResult.errors,
      ...flowIdResult.errors,
      ...permanenceResult.errors
    }
  };
}

// Format trigger for display
export function formatTriggerDisplay(trigger: Trigger): {
  typeLabel: string;
  typeIcon: string;
  statusLabel: string;
  statusColor: string;
} {
  let typeLabel: string;
  let typeIcon: string;

  if (trigger.type === 'membership') {
    typeLabel = trigger.triggerType === 'enter' ? 'On Enter' : 'On Exit';
    typeIcon = trigger.triggerType === 'enter' ? '🚪➡️' : '🚪⬅️';
  } else if (trigger.type === 'permanence') {
    typeLabel = `After ${trigger.permanenceHours}h`;
    typeIcon = '⏰';
  } else {
    typeLabel = trigger.type;
    typeIcon = '⚡';
  }
  
  const statusLabel = trigger.isActive ? 'Active' : 'Inactive';
  const statusColor = trigger.isActive ? 'text-green-600' : 'text-gray-500';

  return {
    typeLabel,
    typeIcon,
    statusLabel,
    statusColor
  };
}

// Generate trigger preview text
export function generateMembershipTriggerPreview(
  title: string,
  body: string,
  flowId: string,
  triggerType: 'enter' | 'exit'
): string {
  const action = triggerType === 'enter' ? 'entering' : 'exiting';
  return `When ${action} the structure, users will see: "${title}" - "${body}" and flow "${flowId}" will be triggered.`;
}

// Generate permanence trigger preview text
export function generatePermanenceTriggerPreview(
  title: string,
  body: string,
  flowId: string,
  permanenceHours: number
): string {
  return `After staying in the structure for ${permanenceHours} hour${permanenceHours !== 1 ? 's' : ''}, users will see: "${title}" - "${body}" and flow "${flowId}" will be triggered.`;
}

// Legacy function for backward compatibility
export const generateTriggerPreview = generateMembershipTriggerPreview;

// Check for duplicate membership triggers
export function hasDuplicateMembershipTrigger(
  triggers: Trigger[],
  structureCode: string,
  triggerType: 'enter' | 'exit',
  excludeId?: string
): boolean {
  return triggers.some(trigger => 
    trigger.type === 'membership' &&
    trigger.structureCode === structureCode &&
    trigger.triggerType === triggerType &&
    trigger.id !== excludeId
  );
}

// Check for duplicate permanence triggers
export function hasDuplicatePermanenceTrigger(
  triggers: Trigger[],
  structureCode: string,
  permanenceHours: number,
  excludeId?: string
): boolean {
  return triggers.some(trigger => 
    trigger.type === 'permanence' &&
    trigger.structureCode === structureCode &&
    trigger.permanenceHours === permanenceHours &&
    trigger.id !== excludeId
  );
}

// Legacy function for backward compatibility
export const hasDuplicateTrigger = hasDuplicateMembershipTrigger;

// Get character count with color coding
export function getCharacterCountInfo(text: string, maxLength: number): {
  count: number;
  remaining: number;
  colorClass: string;
  isValid: boolean;
} {
  const count = text.length;
  const remaining = maxLength - count;
  
  let colorClass = 'text-gray-500';
  if (remaining < 0) {
    colorClass = 'text-red-600';
  } else if (remaining <= 10) {
    colorClass = 'text-yellow-600';
  } else {
    colorClass = 'text-green-600';
  }

  return {
    count,
    remaining,
    colorClass,
    isValid: count <= maxLength
  };
}
