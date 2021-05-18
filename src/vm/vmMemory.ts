import { isEmpty } from 'lodash';
import { VarTypes } from '../utils/types';
import { RANGES } from '../utils/constants';
import {
  jsonStringify,
  getVarType,
  getVarScopeFromAddress,
} from '../utils/helpers';

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

export type LoadInitialMemory = Partial<Record<VarTypes, number>>;
type MemoryMap = Record<string, string | null>;
type MemoryType = keyof typeof scopeRanges;
export type MemoryValue = { addr: string; value: string };

class VmMemory {
  private type: MemoryType;

  private intMemory: MemoryMap | null = null;
  private floatMemory: MemoryMap | null = null;
  private stringMemory: MemoryMap | null = null;
  private allAddresses: string[] = [];

  constructor(type: MemoryType, load: LoadInitialMemory = {}) {
    this.type = type;
    if (!isEmpty(load)) {
      this.initMemory(load);
    }
  }

  initMemory(load: LoadInitialMemory) {
    const scopeRange = scopeRanges[this.type];
    let memCounter = 0;
    let addr = '';

    if (load.int) {
      this.intMemory = {};
      while (memCounter < load.int) {
        addr = String(scopeRange.int[0] + memCounter);
        this.intMemory[addr] = null;
        this.allAddresses.push(addr);
        memCounter++;
      }
      memCounter = 0;
    }

    if (load.float) {
      this.floatMemory = {};
      while (memCounter < load.float) {
        addr = String(scopeRange.float[0] + memCounter);
        this.floatMemory[addr] = null;
        this.allAddresses.push(addr);
        memCounter++;
      }
      memCounter = 0;
    }

    if (load.string) {
      this.stringMemory = {};
      while (memCounter < load.string) {
        addr = String(scopeRange.string[0] + memCounter);
        this.stringMemory[addr] = null;
        this.allAddresses.push(addr);
        memCounter++;
      }
      memCounter = 0;
    }
  }

  isAddrValid(addr: string) {
    return this.allAddresses.includes(addr);
  }

  setIntValue(addr: string, value: string) {
    if (this.intMemory === null) {
      throw new Error(
        'Memory error: tried to set int value when int memory is null'
      );
    }

    this.intMemory[addr] = value;
  }

  setFloatValue(addr: string, value: string) {
    if (this.floatMemory === null) {
      throw new Error(
        'Memory error: tried to set float value when float memory is null'
      );
    }

    this.floatMemory[addr] = value;
  }

  setStringValue(addr: string, value: string) {
    if (this.stringMemory === null) {
      throw new Error(
        'Memory error: tried to set string value when string memory is null'
      );
    }

    this.stringMemory[addr] = value;
  }

  setValues(newValues: MemoryValue[]) {
    newValues.forEach((val) => {
      if (!this.isAddrValid(val.addr)) {
        throw new Error(
          `Memory error: cannot set value to address ${val.addr} because the address doesn't exist in memory`
        );
      }

      const varScope = getVarScopeFromAddress(parseInt(val.addr, 10));
      if (varScope === null) {
        throw new Error(
          `Memory error: address ${val.addr} doesn't fall in any known memory ranges`
        );
      }

      const varType = getVarType(varScope);
      if (varType === null) {
        throw new Error(
          `Memory error: unkwown var type for address ${val.addr}`
        );
      }

      if (varType === 'int') {
        this.setIntValue(val.addr, val.value);
      } else if (varType === 'float') {
        this.setFloatValue(val.addr, val.value);
      } else {
        this.setStringValue(val.addr, val.value);
      }
    });
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
