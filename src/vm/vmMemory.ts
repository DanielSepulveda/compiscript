import { isEmpty } from 'lodash';
import { VarTypes } from '../types';
import { RANGES } from '../utils/constants';
import {
  jsonStringify,
  getVarTypeFromVarScope,
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
export type MemoryValue = string | null;
export type MemoryMap = Record<string, MemoryValue>;
type MemoryType = keyof typeof scopeRanges;

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

  private setIntValue(addr: string, value: MemoryValue) {
    if (this.intMemory === null) {
      throw new Error(
        'Memory error: tried to set int value when int memory is null'
      );
    }

    this.intMemory[addr] = value;
  }

  private setFloatValue(addr: string, value: MemoryValue) {
    if (this.floatMemory === null) {
      throw new Error(
        'Memory error: tried to set float value when float memory is null'
      );
    }

    this.floatMemory[addr] = value;
  }

  private setStringValue(addr: string, value: MemoryValue) {
    if (this.stringMemory === null) {
      throw new Error(
        'Memory error: tried to set string value when string memory is null'
      );
    }

    this.stringMemory[addr] = value;
  }

  private getVarTypeFromAddr(addr: string) {
    if (!this.isAddrValid(addr)) {
      throw new Error(
        `Memory error: cannot set value to address ${addr} because the address doesn't exist in memory`
      );
    }

    const varScope = getVarScopeFromAddress(parseInt(addr));
    if (varScope === null) {
      throw new Error(
        `Memory error: address ${addr} doesn't fall in any known memory ranges`
      );
    }

    const varType = getVarTypeFromVarScope(varScope);
    if (varType === null) {
      throw new Error(`Memory error: unkwown var type for address ${addr}`);
    }

    return varType;
  }

  setValue(addr: string, value: MemoryValue) {
    const varType = this.getVarTypeFromAddr(addr);

    if (varType === 'int') {
      this.setIntValue(addr, value);
    } else if (varType === 'float') {
      this.setFloatValue(addr, value);
    } else {
      this.setStringValue(addr, value);
    }
  }

  setMemory(newMemory: MemoryMap) {
    if (isEmpty(newMemory)) {
      return;
    }

    Object.entries(newMemory).forEach(([addr, val]) => {
      this.setValue(addr, val);
    });
  }

  private getIntValue(addr: string) {
    if (this.intMemory === null) {
      throw new Error(
        'Memory error: tried to get int value when int memory is null'
      );
    }

    return this.intMemory[addr];
  }

  private getFloatValue(addr: string) {
    if (this.floatMemory === null) {
      throw new Error(
        'Memory error: tried to get float value when float memory is null'
      );
    }

    return this.floatMemory[addr];
  }

  private getStringValue(addr: string) {
    if (this.stringMemory === null) {
      throw new Error(
        'Memory error: tried to get string value when string memory is null'
      );
    }

    return this.stringMemory[addr];
  }

  getValue(addr: string) {
    const varType = this.getVarTypeFromAddr(addr);

    if (varType === 'int') {
      return this.getIntValue(addr);
    } else if (varType === 'float') {
      return this.getFloatValue(addr);
    } else {
      return this.getStringValue(addr);
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
