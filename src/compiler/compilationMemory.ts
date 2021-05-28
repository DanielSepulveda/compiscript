import { VarScope } from '../types';
import { RANGES } from '../utils/constants';

type MemoryCounters = Record<VarScope, number>;

export default class CompilationMemory {
  private counters: MemoryCounters;

  constructor() {
    this.counters = {
      globalInt: RANGES.globalInt[0],
      globalFloat: RANGES.globalFloat[0],
      globalString: RANGES.globalString[0],
      localInt: RANGES.localInt[0],
      localIntTemporal: RANGES.localIntTemporal[0],
      localFloat: RANGES.localFloat[0],
      localFloatTemporal: RANGES.localFloatTemporal[0],
      localString: RANGES.localString[0],
      localStringTemporal: RANGES.localStringTemporal[0],
      constantInt: RANGES.constantInt[0],
      constantFloat: RANGES.constantFloat[0],
      constantString: RANGES.constantString[0],
      pointerInt: RANGES.pointerInt[0],
      pointerFloat: RANGES.pointerFloat[0],
      pointerString: RANGES.pointerString[0],
    };
  }

  getNextAddressFor(counter: VarScope): number {
    const currentAddr = this.counters[counter];
    const maxAddr = RANGES[counter][1];

    if (currentAddr > maxAddr) {
      throw new Error(`Memory overflow for ${counter}`);
    }

    return this.counters[counter]++;
  }

  sumCounterBy(counter: VarScope, amount: number) {
    const currentAddr = this.counters[counter];
    const maxAddr = RANGES[counter][1];

    if (currentAddr > maxAddr || currentAddr + amount > maxAddr) {
      throw new Error(`Memory overflow for ${counter}`);
    }

    this.counters[counter] += amount;
  }
}
