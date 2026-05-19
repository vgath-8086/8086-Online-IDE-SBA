export const CompilerErrorCode = {
  // ── Lexical analysis ─────────────────────────────────────────────────────────
  ILLEGAL_EXPRESSION:            'Illegal expression',
  ILLEGAL_VARIABLE_NAME:         'Illegal variable name',
  WRONG_VARIABLE_VALUE:          'Wrong variable value',
  MISMATCHED_QUOTES:             'Mismatched or misplaced quotes',
  WRONG_DUP_PARAMETER:           'Wrong DUP parameter',
  WRONG_DUP_VALUE:               'Wrong DUP value',
  ILLEGAL_TABLE_VALUE:           'Illegal table value',
  ILLEGAL_MACRO_NAME:            'Illegal macro name',
  ILLEGAL_PARAMETER_NAME:        'Illegal parameter name',
  ILLEGAL_INSTRUCTION:           'Illegal instruction',
  ILLEGAL_STRING_FORMAT:         'Illegal string format',
  ILLEGAL_OPERANDS:              'Illegal operands',

  // ── Operand classifier ────────────────────────────────────────────────────────
  INVALID_MEMORY_ADDRESSING:     'Invalid memory addressing',
  INVALID_OFFSET_OR_VAR_NAME:    'Invalid offset or variable name',

  // ── Preprocessor: DEFINE ─────────────────────────────────────────────────────
  INVALID_OPERANDS_FOR_DEFINE:   'Invalid operands for DEFINE instruction',
  INVALID_OPERANDS:              'Invalid operands',

  // ── Preprocessor: shift/rotate expansion ─────────────────────────────────────
  INVALID_OPERANDS_FOR_SHIFT:    'Invalid operands for shift/rotate instruction',
  OPERAND_OUT_OF_RANGE:          'Operand out of range',

  // ── Preprocessor: procedures ──────────────────────────────────────────────────
  WRONG_PROCEDURE_DECLARATION:   'Wrong procedure declaration',
  INVALID_INSTRUCTION_IN_PROC:   'Invalid instruction in procedure body',
  MISSING_ENDP:                  'Unable to find ENDP symbol',
  PROCEDURE_EMPTY:               'Procedure is empty',

  // ── Preprocessor: variables / labels ─────────────────────────────────────────
  VARIABLE_OR_LABEL_MISSING:     "Variable or label doesn't exist",
  VARIABLE_MISSING:              "Variable doesn't exist",
  OPERAND_EXCEEDS_BYTE:          'Operand out of range (exceeds one byte)',
  OPERAND_EXCEEDS_WORD:          'Operand out of range (exceeds two bytes)',
  DUP_OUT_OF_RANGE:              'DUP operand out of range',

  // ── Preprocessor: ORG ────────────────────────────────────────────────────────
  ORG_WRONG_PARAMETER_COUNT:     'Illegal number of parameters for ORG',
  ORG_PARAMETER_MUST_BE_INTEGER: 'ORG parameter must be an integer',
  ORG_OPERAND_OUT_OF_RANGE:      'ORG operand out of range',

  // ── Macro expander ────────────────────────────────────────────────────────────
  ILLEGAL_LOCAL_DIRECTIVE:       'Illegal use of LOCAL directive outside macro',
  ILLEGAL_ENDM_DIRECTIVE:        'Illegal use of ENDM directive outside macro',
  MISSING_ENDM:                  'Macro declaration missing ENDM symbol',
  DUPLICATE_MACRO_NAMES:         'Duplicate macro names',
  SINGLE_LOCAL_ONLY:             'Only one LOCAL directive allowed per macro',
  UNDECLARED_MACRO:              'Undeclared macro',
  WRONG_MACRO_PARAMETER_COUNT:   'Wrong number of macro parameters',
  MACRO_RECURSION_DETECTED:      'Macro recursion detected',

  // ── Syntax validators ─────────────────────────────────────────────────────────
  NUMBER_OVERFLOW:               'Number overflow',
  WRONG_OPERANDS:                'Wrong operands',
  AMBIGUOUS_MEMORY_SIZE:         'Ambiguous memory size: specify byte or word',
  ILLEGAL_PARAMETERS:            'Illegal parameters',
  OUT_OF_BOUND_OPERAND:          'Out of bound operand',
  WRONG_PARAMETER_TYPE:          'Wrong parameter type',
  ILLEGAL_PARAMETER_COUNT:       'Illegal number of parameters',
  UNMATCHED_OPERAND_SIZE:        'Unmatched operand size',
  DISPLACEMENT_OVERFLOW:         'Displacement overflow',
  ILLEGAL_OPERANDS_OR_SIZE_MISMATCH: 'Illegal operands or mismatched operand size',
  REQUIRED_LABEL:                'Required label',
  INVALID_OPERAND:               'Invalid operand',

  // ── Linkage ───────────────────────────────────────────────────────────────────
  JUMP_OUT_OF_BOUNDS:            'Jump operation out of bounds',
} as const;

export type CompilerErrorCode = typeof CompilerErrorCode[keyof typeof CompilerErrorCode];
