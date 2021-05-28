import { isEmpty } from 'lodash';
import { VarTypes, Scope } from '../types';
import { RANGES } from '../utils/constants';
import {
  jsonStringify,
  getVarTypeFromVarScope,
  getVarScopeFromAddress,
} from '../utils/helpers';

type ScopeRanges = Record<Scope, Record<VarTypes, [number, number]>>;

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
  pointer: {
    int: RANGES.pointerInt,
    float: RANGES.pointerFloat,
    string: RANGES.pointerString,
  },
};

export type LoadInitialMemory = Partial<Record<VarTypes, number>>;
export type MemoryValue = string | null;
export type MemoryMap = Record<string, MemoryValue>;
type MemoryScope = keyof typeof scopeRanges;

class VmMemory {
  private scope: MemoryScope;

  private memory: Record<VarTypes, MemoryMap | null> = {
    int: null,
    float: null,
    string: null,
  };

  private allAddresses: string[] = [];

  constructor(scope: MemoryScope, load: LoadInitialMemory = {}) {
    this.scope = scope;
    if (!isEmpty(load)) {
      this.initMemory(load);
    }
  }

  private initMemoryType(size: number, type: VarTypes) {
    const baseAddr = scopeRanges[this.scope][type][0];
    let memCounter = 0;
    let addr = '';
    let tempMemory: MemoryMap = {};

    while (memCounter < size) {
      addr = String(baseAddr + memCounter);
      tempMemory[addr] = null;
      this.allAddresses.push(addr);
      memCounter++;
    }

    this.memory[type] = tempMemory;
  }

  initMemory(load: LoadInitialMemory) {
    if (load.int) {
      this.initMemoryType(load.int, 'int');
    }

    if (load.float) {
      this.initMemoryType(load.float, 'float');
    }

    if (load.string) {
      this.initMemoryType(load.string, 'string');
    }
  }

  isAddrValid(addr: string) {
    return this.allAddresses.includes(addr);
  }

  private setIntValue(addr: string, value: MemoryValue) {
    if (this.memory.int === null) {
      throw new Error(
        'Memory error: tried to set int value when int memory is null'
      );
    }

    this.memory.int[addr] = value;
  }

  private setFloatValue(addr: string, value: MemoryValue) {
    if (this.memory.float === null) {
      throw new Error(
        'Memory error: tried to set float value when float memory is null'
      );
    }

    this.memory.float[addr] = value;
  }

  private setStringValue(addr: string, value: MemoryValue) {
    if (this.memory.string === null) {
      throw new Error(
        'Memory error: tried to set string value when string memory is null'
      );
    }

    this.memory.string[addr] = value;
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
    if (this.memory.int === null) {
      throw new Error(
        'Memory error: tried to get int value when int memory is null'
      );
    }

    return this.memory.int[addr];
  }

  private getFloatValue(addr: string) {
    if (this.memory.float === null) {
      throw new Error(
        'Memory error: tried to get float value when float memory is null'
      );
    }

    return this.memory.float[addr];
  }

  private getStringValue(addr: string) {
    if (this.memory.string === null) {
      throw new Error(
        'Memory error: tried to get string value when string memory is null'
      );
    }

    return this.memory.string[addr];
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
    return jsonStringify(this.memory);
  }
}

export default VmMemory;
