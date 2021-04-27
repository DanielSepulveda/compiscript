import grammar from './grammar';

const parse = (input: string) => {
  const matchResult = grammar.match(input);
  if (matchResult.succeeded()) {
    return matchResult;
  } else {
    throw new Error(matchResult.message);
  }
};

export default parse;
