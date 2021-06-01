import {
  Types,
  Operators,
  OperandResultTypes,
  OperationExpression,
} from '../types';

/* -------------------------------------------------------------------------- */
/*                                Dictionaries                                */
/* -------------------------------------------------------------------------- */

type OperatorDict = Record<Types, Record<Types, OperandResultTypes>>;

/* ---------------------------------- Plus ---------------------------------- */

const plusDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'float',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'string',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- Minus --------------------------------- */

const minusDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'float',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- Mult ---------------------------------- */

const multDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'float',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- Div ---------------------------------- */

const divDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'float',
    float: 'float',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- GT ----------------------------------- */

const gtDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- LT ----------------------------------- */

const ltDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- GT EQ --------------------------------- */

const gtEqDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- LT EQ --------------------------------- */

const ltEqDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- EQ ----------------------------------- */

const eqDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'int',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- N EQ ---------------------------------- */

const nEqDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'int',
    float: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'int',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- And ---------------------------------- */

const andDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- Or ----------------------------------- */

const orDict: OperatorDict = {
  int: {
    int: 'int',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  float: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    float: 'error',
    string: 'error',
    void: 'error',
  },
};

/* -------------------------------------------------------------------------- */
/*                                Semantic Cube                               */
/* -------------------------------------------------------------------------- */

type SemanticCube = Record<
  Operators,
  Record<Types, Record<Types, OperandResultTypes>>
>;

export const semanticCube: SemanticCube = {
  '+': plusDict,
  '-': minusDict,
  '*': multDict,
  '/': divDict,
  '>': gtDict,
  '<': ltDict,
  '>=': gtEqDict,
  '<=': ltEqDict,
  '==': eqDict,
  '!=': nEqDict,
  and: andDict,
  or: orDict,
};

/**
 * Given an operation expression (operation, left operand, right operand),
 * this function determines the result type by using the semanticCube.
 *
 * @param exp `OperationExpression`
 * @returns `OperandResultType`
 */
export function getOperationResultType(exp: OperationExpression) {
  const res = semanticCube[exp.op][exp.left][exp.right];

  return res;
}
