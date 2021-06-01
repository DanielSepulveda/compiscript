import { VarScope } from '../types';
import { RANGES } from '../utils/constants';

type AvailCounters = Record<VarScope, number>;

/**
 * The avail class handles the memory addresses used during compilation
 * for each variable scope.
 */

export default class Avail {
  private counters: AvailCounters;

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

  /**
   * Returns the next available address for a certain variable
   * scope. If there is no available address it throws an error.
   * @param counter `VarScope`
   * @returns `number`
   */
  getNextAddressFor(counter: VarScope): number {
    const currentAddr = this.counters[counter];
    const maxAddr = RANGES[counter][1];

    if (currentAddr > maxAddr) {
      throw new Error(`Memory overflow for ${counter}`);
    }

    return this.counters[counter]++;
  }

  /**
   * Increases the memory counter for a certain variable scope
   * by an amount. This is usefull for when declaring arrays.
   * @param counter `VarScope`
   * @param amount `number`
   */
  sumCounterBy(counter: VarScope, amount: number) {
    const currentAddr = this.counters[counter];
    const maxAddr = RANGES[counter][1];

    if (currentAddr > maxAddr || currentAddr + amount > maxAddr) {
      throw new Error(`Memory overflow for ${counter}`);
    }

    this.counters[counter] += amount;
  }
}
