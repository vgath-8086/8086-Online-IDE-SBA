/** Shared mutable execution state — injected into both Processor and ConsoleW
 *  to break the circular dependency between them. */
export class CpuState {
  pause: boolean = false;
}
