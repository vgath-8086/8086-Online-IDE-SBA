import { SyntaxValidatorRegistry } from './syntax-validator-registry.js';
import { SyntaxAnalysis }          from './syntax-analysis.js';
import { MovValidator }            from './validators/mov.validator.js';
import { PushPopValidator }        from './validators/push-pop.validator.js';
import { XchgValidator }           from './validators/xchg.validator.js';
import { JmpCallValidator }        from './validators/jmp-call.validator.js';
import { LeaValidator }            from './validators/lea.validator.js';
import { IntValidator }            from './validators/int.validator.js';
import { RepValidator }            from './validators/rep.validator.js';
import { ArithValidator }          from './validators/arith.validator.js';
import { ShiftValidator }          from './validators/shift.validator.js';
import { NoopValidator }           from './validators/noop.validator.js';
import { OneOpValidator }          from './validators/oneop.validator.js';
import { CondJmpValidator }        from './validators/cond-jmp.validator.js';

export function createSyntaxAnalysis(): SyntaxAnalysis {
  const registry = new SyntaxValidatorRegistry()
    .register(new MovValidator())
    .register(new PushPopValidator())
    .register(new XchgValidator())
    .register(new JmpCallValidator())
    .register(new LeaValidator())
    .register(new IntValidator())
    .register(new RepValidator())
    .register(new ArithValidator())
    .register(new ShiftValidator())
    .register(new NoopValidator())
    .register(new OneOpValidator())
    .register(new CondJmpValidator());
  return new SyntaxAnalysis(registry);
}

export { SyntaxAnalysis }          from './syntax-analysis.js';
export { SyntaxValidatorRegistry } from './syntax-validator-registry.js';
