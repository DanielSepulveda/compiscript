import { MemoryPointers as Pointers } from '../utils/types';

type RangeMinMax = [number, number];

const ranges: Record<Pointers, RangeMinMax> = {
  globalInt: [1000, 1999],
  globalFloat: [2000, 2999],
  globalString: [3000, 3999],
  localInt: [4000, 4999],
  localIntTemporal: [5000, 5999],
  localFloat: [6000, 6999],
  localFloatTemporal: [7000, 7999],
  localString: [8000, 8999],
  localStringTemporal: [9000, 9999],
  constantInt: [10_000, 10_999],
  constantFloat: [11_000, 11_999],
  constantString: [12_000, 12_999],
};

type MemoryPointers = Record<Pointers, number>;

export class Memory {
  private pointers: MemoryPointers;

  constructor() {
    this.pointers = {
      globalInt: ranges.globalInt[0],
      globalFloat: ranges.globalFloat[0],
      globalString: ranges.globalString[0],
      localInt: ranges.localInt[0],
      localIntTemporal: ranges.localIntTemporal[0],
      localFloat: ranges.localFloat[0],
      localFloatTemporal: ranges.localFloatTemporal[0],
      localString: ranges.localString[0],
      localStringTemporal: ranges.localStringTemporal[0],
      constantInt: ranges.constantInt[0],
      constantFloat: ranges.constantFloat[0],
      constantString: ranges.constantString[0],
    };
  }

  getNextAddressFor(pointer: Pointers): number {
    const currentAddr = this.pointers[pointer];
    const maxAddr = ranges[pointer][1];

    if (currentAddr > maxAddr) {
      throw new Error(`Stack overflow for ${pointer}`);
    }

    return this.pointers[pointer]++;
  }
}
