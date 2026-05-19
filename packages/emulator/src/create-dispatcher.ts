import { InstructionDispatcher }  from './instruction-dispatcher.js';
import { MovHandler }         from './handlers/mov.handler.js';
import { AddSubHandler }      from './handlers/add-sub.handler.js';
import { ImmArithHandler }    from './handlers/imm-arith.handler.js';
import { GroupF6Handler }     from './handlers/group-f6.handler.js';
import { CmpHandler }         from './handlers/cmp.handler.js';
import { LogicHandler }       from './handlers/logic.handler.js';
import { ShiftRotateHandler } from './handlers/shift-rotate.handler.js';
import { XchgHandler }        from './handlers/xchg.handler.js';
import { LeaHandler }         from './handlers/lea.handler.js';
import { PushPopHandler }     from './handlers/push-pop.handler.js';
import { InterruptHandler }   from './handlers/interrupt.handler.js';
import { CondJumpHandler }    from './handlers/cond-jump.handler.js';
import { JumpHandler }        from './handlers/jump.handler.js';
import { StringHandler }      from './handlers/string.handler.js';
import { IncDecHandler }      from './handlers/inc-dec.handler.js';
import { FlagHandler }        from './handlers/flag.handler.js';
import { CallRetHandler }     from './handlers/call-ret.handler.js';
import { LoopHandler }        from './handlers/loop.handler.js';

export function createDispatcher(): InstructionDispatcher {
  return new InstructionDispatcher()
    .register(new MovHandler())
    .register(new AddSubHandler())
    .register(new GroupF6Handler())
    .register(new CmpHandler())
    .register(new ShiftRotateHandler())
    .register(new LogicHandler())
    .register(new XchgHandler())
    .register(new ImmArithHandler())
    .register(new PushPopHandler())
    .register(new InterruptHandler())
    .register(new LeaHandler())
    .register(new CondJumpHandler())
    .register(new JumpHandler())
    .register(new StringHandler())
    .register(new IncDecHandler())
    .register(new FlagHandler())
    .register(new CallRetHandler())
    .register(new LoopHandler());
}
