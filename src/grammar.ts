// import * as fs from 'fs';
// import * as path from 'path';
import ohm from 'ohm-js';

const grammar = `
Compiscript {
  /* -------------------------------------------------------------------------- */
  /*                                Starting Rule                               */
  /* -------------------------------------------------------------------------- */

    Start = Program

  /* -------------------------------------------------------------------------- */
  /*                                Lexical Rules                               */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------- Keywords -------------------------------- */

    program = "Program"
    main = "main"
    vars = "vars"
    if = "if"
    else = "else"
    print = "print"
    println = "println"
    function = "function"
    return = "return"
    read = "read"
    while = "while"
    for = "for"
    until = "until"
    type = "int" | "float" | "string"
    void = "void"
    keyword = program | vars | if       | println | print | type
              | else  | main | function | return  | read
              | while | for  | until    | void

  /* -------------------------------- Patterns -------------------------------- */

    char = any
    stringChar = ~"\\"" char
    string = "\\"" stringChar* "\\""
    decimalDigit = "0".."9"
    nonZeroDigit = "1".."9"
    integer (an integer) = nonZeroDigit decimalDigit* -- nonZero
            | "0"                                     -- zero
    float (a float) = integer "." decimalDigit* -- completeFloat
            | "." decimalDigit*                 -- decimalFloat
    number = float | integer
    signedNumber = "+" number | "-" number
    identifierStart = letter | "_"
    identifierPart = identifierStart | decimalDigit
    identifierName = identifierStart identifierPart*
    identifier (an identifier) = ~keyword identifierName

    literal = string | signedNumber | number

    singleLineComment = "//" (~"\\n" char)* &("\\n" | end)
    multiLineComment = "/*" (~"*/" char)* "*/"
    comment = singleLineComment | multiLineComment

    space += comment

    functionType = type | void

  /* -------------------------------------------------------------------------- */
  /*                               Syntactic Rules                              */
  /* -------------------------------------------------------------------------- */

  /* ------------------------------- Expressions ------------------------------- */

  ArrayExpression = identifier "[" Expression "]" ("[" Expression "]")?

  CallExpression = identifier "(" ListOf<Expression, ","> ")"

  PrimaryExpression = ArrayExpression -- arrExp
                    | CallExpression -- callExp
                    | identifier -- id
                    | literal -- literal
                    | "(" Expression ")" -- parenExp
  
  MultExpression = MultExpression "*" PrimaryExpression -- mult
                  | MultExpression "/" PrimaryExpression -- div
                  | PrimaryExpression
  
  AddExpression = AddExpression "+" MultExpression -- add
                  | AddExpression "-" MultExpression -- sub
                  | MultExpression
  
  RelExpression = RelExpression "<" AddExpression -- lt
                  | RelExpression ">" AddExpression -- gt
                  | RelExpression "<=" AddExpression -- lteq
                  | RelExpression ">=" AddExpression -- gteq
                  | AddExpression
  
  EqExpression = EqExpression "==" RelExpression -- equal
                | EqExpression "!=" RelExpression -- notEqual
                | RelExpression
  
  AndExpression = AndExpression "and" EqExpression -- lAnd
                | EqExpression
  
  OrExpression = OrExpression "or" AndExpression -- lOr
              | AndExpression
  
  Expression = OrExpression

  VariableExpression = ArrayExpression -- varArr
                      | identifier -- varId 

  AssignExpression = VariableExpression "=" Expression

  PrintExpression = Expression

  ReadExpression = VariableExpression

  /* ------------------------------- Statements ------------------------------- */

  Dimension = "[" decimalDigit+ "]" ("[" decimalDigit+ "]")?
  VariableDeclaration = identifier Dimension?
  VariableStatement = NonemptyListOf<VariableDeclaration, ","> ":" type ";"
  VarBlock = "vars" VariableStatement+

  Statement = AssigmentStatement
            | CallStatement
            | IfStatement
            | IterationStatement
            | ReadStatement
            | PrintlnStatement
            | PrintStatement
            | ReturnStatement
  
  Block = "{" Statement* "}"

  AssigmentStatement = AssignExpression ";"

  CallStatement = CallExpression ";"

  IfElseStatement = else Block
  IfStatement = if "(" Expression ")" Block IfElseStatement?

  IterationStatement = while "(" Expression ")" Block               -- whileDo
                      | for "(" AssignExpression ")" until "(" Expression ")" Block -- forDo

  ReadStatement = read "(" NonemptyListOf<ReadExpression, ","> ")" ";"

  PrintlnStatement = println "(" NonemptyListOf<PrintExpression, ","> ")" ";"

  PrintStatement = print "(" NonemptyListOf<PrintExpression, ","> ")" ";"

  ReturnStatement = return "(" Expression ")" ";"

  /* -------------------------------- Functions ------------------------------- */

  FunctionParam = identifier ":" type
  FunctionParams = ListOf<FunctionParam, ",">
  FunctionDeclaration = functionType function identifier "(" FunctionParams ")"
  FunctionStatement = FunctionDeclaration VarBlock? Block

  MainStatement = main "(" ")" Block

  /* -------------------------------------------------------------------------- */
  /*                                   Program                                  */
  /* -------------------------------------------------------------------------- */

  Program = program identifier ";" VarBlock? FunctionStatement* MainStatement
}
`;

// const grammarFile = fs
//   .readFileSync(path.join(__dirname, 'grammar.ohm'))
//   .toString();

const g = ohm.grammar(grammar);

export default g;
