import { isEmpty } from 'lodash';
import { VarTypes, Scope } from '../types';
import { RANGES } from '../utils/constants';
import {
  jsonStringify,
  getVarTypeFromVarScope,
  getVarScopeFromAddress,
} from '../utils/helpers';

/**
 * This class handles the memory usage during execution.
 * Here we also define methods which are used whenever we
 * want to obtain or store a certain value.
 */

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

  // Memory maps for each variable type
  private memory: Record<VarTypes, MemoryMap | null> = {
    int: null,
    float: null,
    string: null,
  };

  // Addresses list used to know if an address has been defined
  private allAddresses: string[] = [];

  /**
   * VmMemory constructor used to link it to a specific
   * memory scope and optionally initialize its size.
   *
   * @param scope `MemoryScope`
   * @param load `LoadInitialMemory`
   */
  constructor(scope: MemoryScope, load: LoadInitialMemory = {}) {
    this.scope = scope;
    if (!isEmpty(load)) {
      this.initMemory(load);
    }
  }

  /**
   * This function initializes a memory map for a given
   * variable type with a given size.
   *
   * @param size `number`
   * @param type `VarType`
   */
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

  /**
   * This function receives the initial memory and
   * initializes the corresponding memory maps
   *
   * @param load `LoadInitialMemory`
   */
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

  /**
   * Asserts that an address exists in the current memory
   *
   * @param addr `string`
   * @returns `boolean`
   */
  isAddrValid(addr: string) {
    return this.allAddresses.includes(addr);
  }

  /**
   * Sets a value in the given adress for the int memory
   * map
   *
   * @param addr `string`
   * @param value `MemoryValue`
   */
  private setIntValue(addr: string, value: MemoryValue) {
    if (this.memory.int === null) {
      throw new Error(
        'Memory error: tried to set int value when int memory is null'
      );
    }

    this.memory.int[addr] = value;
  }

  /**
   * Sets a value in the given adress for the float memory
   * map
   *
   * @param addr `string`
   * @param value `MemoryValue`
   */
  private setFloatValue(addr: string, value: MemoryValue) {
    if (this.memory.float === null) {
      throw new Error(
        'Memory error: tried to set float value when float memory is null'
      );
    }

    this.memory.float[addr] = value;
  }

  /**
   * Sets a value in the given adress for the string memory
   * map
   *
   * @param addr `string`
   * @param value `MemoryValue`
   */
  private setStringValue(addr: string, value: MemoryValue) {
    if (this.memory.string === null) {
      throw new Error(
        'Memory error: tried to set string value when string memory is null'
      );
    }

    this.memory.string[addr] = value;
  }

  /**
   * Obtains the variable type for a given address
   *
   * @param addr `string`
   * @returns `VarType`
   */
  private getVarTypeFromAddr(addr: string) {
    if (!this.isAddrValid(addr)) {
      throw new Error(
        `Memory error: tried to access an address that doesn't exist in memory`
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

  /**
   * Sets a memory address with a given value by calling
   * the corresponding method for the address variable
   * type
   *
   * @param addr `string`
   * @param value `MemoryValue`
   */
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

  /**
   * Fills the memory with values.
   *
   * @param newMemory `MemoryMap`
   * @returns
   */
  setMemory(newMemory: MemoryMap) {
    if (isEmpty(newMemory)) {
      return;
    }

    Object.entries(newMemory).forEach(([addr, val]) => {
      this.setValue(addr, val);
    });
  }

  /**
   * Returns the value of a given address from the
   * int memory map
   *
   * @param addr `string`
   * @returns `MemoryValue`
   */
  private getIntValue(addr: string) {
    if (this.memory.int === null) {
      throw new Error(
        'Memory error: tried to get int value when int memory is null'
      );
    }

    return this.memory.int[addr];
  }

  /**
   * Returns the value of a given address from the
   * float memory map
   *
   * @param addr `string`
   * @returns `MemoryValue`
   */
  private getFloatValue(addr: string) {
    if (this.memory.float === null) {
      throw new Error(
        'Memory error: tried to get float value when float memory is null'
      );
    }

    return this.memory.float[addr];
  }

  /**
   * Returns the value of a given address from the
   * string memory map
   *
   * @param addr `string`
   * @returns `MemoryValue`
   */
  private getStringValue(addr: string) {
    if (this.memory.string === null) {
      throw new Error(
        'Memory error: tried to get string value when string memory is null'
      );
    }

    return this.memory.string[addr];
  }

  /**
   * Returns the value of a given address
   *
   * @param addr `string`
   * @returns `MemoryValue`
   */
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

  /**
   * Transforms the memory object to a json object,
   * usefull for debugging.
   *
   * @returns `Record<VarTypes, MemoryMap | null>`
   */
  toJson() {
    return jsonStringify(this.memory);
  }
}

export default VmMemory;
