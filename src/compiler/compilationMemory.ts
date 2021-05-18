import { MemoryCounter } from '../utils/types';
import { RANGES } from '../utils/constants';

type MemoryCounters = Record<MemoryCounter, number>;

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
    };
  }

  getNextAddressFor(counter: MemoryCounter): number {
    const currentAddr = this.counters[counter];
    const maxAddr = RANGES[counter][1];

    if (currentAddr > maxAddr) {
      throw new Error(`Stack overflow for ${counter}`);
    }

    return this.counters[counter]++;
  }
}
