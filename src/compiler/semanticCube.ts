import { Types, Operators, OperandResultTypes } from '../utils/types';

/* -------------------------------------------------------------------------- */
/*                                Dictionaries                                */
/* -------------------------------------------------------------------------- */

type OperatorDict = Record<Types, Record<Types, OperandResultTypes>>;

/* ---------------------------------- Plus ---------------------------------- */

const plusDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'double',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'string',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- Minus --------------------------------- */

const minusDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'double',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- Mult ---------------------------------- */

const multDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'double',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- Div ---------------------------------- */

const divDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'double',
    double: 'double',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- GT ----------------------------------- */

const gtDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- LT ----------------------------------- */

const ltDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- GT EQ --------------------------------- */

const gtEqDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- LT EQ --------------------------------- */

const ltEqDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ----------------------------------- EQ ----------------------------------- */

const eqDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'int',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
    string: 'error',
    void: 'error',
  },
};

/* ---------------------------------- N EQ ---------------------------------- */

const nEqDict: OperatorDict = {
  int: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  double: {
    int: 'int',
    double: 'int',
    string: 'error',
    void: 'error',
  },
  string: {
    int: 'error',
    double: 'error',
    string: 'int',
    void: 'error',
  },
  void: {
    int: 'error',
    double: 'error',
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
};

type Expression = {
  left: Types;
  right: Types;
  op: Operators;
};

const getSemanticCubeType = (exp: Expression) => {
  const res = semanticCube[exp.op][exp.left][exp.right];

  if (res === 'error') {
    throw new Error(
      `Invalid use of operator ${exp.op} for the given types ${exp.left} and ${exp.right}`
    );
  }

  return res;
};

export default getSemanticCubeType;
