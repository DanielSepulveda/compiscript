import { isEmpty } from 'lodash';
import { VarTypes } from '../utils/types';
import { RANGES } from '../utils/constants';
import { jsonStringify } from '../utils/helpers';

type scopes = 'global' | 'local' | 'temporal' | 'constant';
type ScopeRanges = Record<scopes, Record<VarTypes, [number, number]>>;

const scopeRanges: ScopeRanges = {
  global: {
    int: RANGES.globalInt,
    float: RANGES.globalFloat,
    string: RANGES.globalString,
  },
  local: {
    int: RANGES.localInt,
    float: RANGES.localFloat,
    string: RANGES.localString,
  },
  temporal: {
    int: RANGES.localIntTemporal,
    float: RANGES.localFloatTemporal,
    string: RANGES.localStringTemporal,
  },
  constant: {
    int: RANGES.constantInt,
    float: RANGES.constantFloat,
    string: RANGES.constantString,
  },
};

type LoadInitialMemory = Partial<Record<VarTypes, number>>;
type MemoryMap = Record<string, string | null>;
type MemoryType = keyof typeof scopeRanges;

class VmMemory {
  private type: MemoryType;

  private intMemory: MemoryMap | null = null;
  private floatMemory: MemoryMap | null = null;
  private stringMemory: MemoryMap | null = null;

  constructor(type: MemoryType, load: LoadInitialMemory = {}) {
    this.type = type;
    if (!isEmpty(load)) {
      this.initMemory(load);
    }
  }

  initMemory(load: LoadInitialMemory) {
    const scopeRange = scopeRanges[this.type];
    let memCounter = 0;

    if (load.int) {
      this.intMemory = {};
      while (memCounter < load.int) {
        this.intMemory[scopeRange.int[0] + memCounter] = null;
        memCounter++;
      }
      memCounter = 0;
    }

    if (load.float) {
      this.floatMemory = {};
      while (memCounter < load.float) {
        this.floatMemory[scopeRange.float[0] + memCounter] = null;
        memCounter++;
      }
      memCounter = 0;
    }

    if (load.string) {
      this.stringMemory = {};
      while (memCounter < load.string) {
        this.stringMemory[scopeRange.string[0] + memCounter] = null;
        memCounter++;
      }
      memCounter = 0;
    }
  }

  toJson() {
    const output = {
      int: this.intMemory,
      float: this.floatMemory,
      string: this.stringMemory,
    };

    return jsonStringify(output);
  }
}

export default VmMemory;
