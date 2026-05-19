/**
 * Reasons why `startRun` or `singleStep` stopped execution.
 * These are expected outcomes, not errors — the run loop uses this to
 * communicate what happened, not that something went wrong.
 */
export const ExecutionStopReason = {
  SUCCESS:        'Execution ended successfully',
  BREAKPOINT_HIT: 'Breakpoint hit',
  INFINITE_LOOP:  'Infinite loop detected',
} as const;

export type ExecutionStopReason = typeof ExecutionStopReason[keyof typeof ExecutionStopReason];

/**
 * Error codes returned by `parsePhysicalAddress` when the user-supplied
 * address string cannot be resolved to a valid 20-bit physical address.
 */
export const AddressParseError = {
  ADDRESS_OUT_OF_BOUND:   'Address out of bound',
  INVALID_ADDRESS_FORMAT: 'Invalid address format',
} as const;

export type AddressParseError = typeof AddressParseError[keyof typeof AddressParseError];
