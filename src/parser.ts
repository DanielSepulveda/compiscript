import grammar from './grammar';

/**
 * Parse function receives a string which corresponds to a
 * Compiscript program, then it validates that program against
 * the grammar. If it succeeds, it returns a valid ohm result,
 * otherwise it throws an error.
 *
 * @param input `string`
 * @returns `ohm.MatchResult`
 */
const parse = (input: string) => {
  const matchResult = grammar.match(input);
  if (matchResult.succeeded()) {
    return matchResult;
  } else {
    throw new Error(matchResult.message);
  }
};

export default parse;
