/**
 * Formula parsing & evaluation engine for SimpleSheet
 */

import { GridData } from '../types';
import { cellIdToCoords, coordsToCellId, getCellsInRange } from './formatters';

export type FormulaError = '#ERROR!' | '#CIRCULAR!' | '#REF!' | '#NAME?' | '#DIV/0!' | '#VALUE!';

/**
 * Evaluates a single cell value or formula given the whole grid data state
 */
export function evaluateCell(
  cellId: string,
  gridData: GridData,
  visited: Set<string> = new Set()
): string {
  const cell = gridData[cellId];
  if (!cell || !cell.value) return '';

  const raw = cell.value.trim();

  // If not a formula, return raw text
  if (!raw.startsWith('=')) {
    return raw;
  }

  // Check for circular reference
  if (visited.has(cellId.toUpperCase())) {
    return '#CIRCULAR!';
  }

  visited.add(cellId.toUpperCase());

  try {
    const formulaBody = raw.substring(1);
    const result = evaluateExpression(formulaBody, gridData, visited);
    visited.delete(cellId.toUpperCase());
    return String(result);
  } catch (err: any) {
    visited.delete(cellId.toUpperCase());
    if (typeof err === 'string' && err.startsWith('#')) {
      return err;
    }
    return '#ERROR!';
  }
}

/**
 * Expression evaluator using recursive descent / Tokenizer
 */
function evaluateExpression(
  expr: string,
  gridData: GridData,
  visited: Set<string>
): number | string {
  const tokens = tokenize(expr);
  if (tokens.length === 0) return '';

  let index = 0;

  function parseExpression(): number | string {
    let left = parseTerm();

    while (index < tokens.length) {
      const op = tokens[index];
      if (op === '+' || op === '-') {
        index++;
        const right = parseTerm();
        const numL = Number(left);
        const numR = Number(right);

        if (isNaN(numL) || isNaN(numR)) {
          // If string concatenation with '+'
          if (op === '+' && (typeof left === 'string' || typeof right === 'string')) {
            left = String(left) + String(right);
            continue;
          }
          throw '#VALUE!';
        }

        left = op === '+' ? numL + numR : numL - numR;
      } else if (['>', '<', '>=', '<=', '=', '<>'].includes(op)) {
        index++;
        const right = parseTerm();
        const numL = Number(left);
        const numR = Number(right);

        const useNumeric = !isNaN(numL) && !isNaN(numR);
        const lVal = useNumeric ? numL : String(left);
        const rVal = useNumeric ? numR : String(right);

        if (op === '=') left = lVal === rVal ? 1 : 0;
        else if (op === '<>') left = lVal !== rVal ? 1 : 0;
        else if (op === '>') left = lVal > rVal ? 1 : 0;
        else if (op === '<') left = lVal < rVal ? 1 : 0;
        else if (op === '>=') left = lVal >= rVal ? 1 : 0;
        else if (op === '<=') left = lVal <= rVal ? 1 : 0;
      } else {
        break;
      }
    }

    return left;
  }

  function parseTerm(): number | string {
    let left = parseFactor();

    while (index < tokens.length) {
      const op = tokens[index];
      if (op === '*' || op === '/' || op === '^') {
        index++;
        const right = parseFactor();
        const numL = Number(left);
        const numR = Number(right);

        if (isNaN(numL) || isNaN(numR)) throw '#VALUE!';

        if (op === '*') left = numL * numR;
        else if (op === '/') {
          if (numR === 0) throw '#DIV/0!';
          left = numL / numR;
        } else if (op === '^') {
          left = Math.pow(numL, numR);
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseFactor(): number | string {
    const token = tokens[index];

    if (!token) throw '#ERROR!';

    // Unary plus or minus
    if (token === '-') {
      index++;
      const val = Number(parseFactor());
      if (isNaN(val)) throw '#VALUE!';
      return -val;
    } else if (token === '+') {
      index++;
      return parseFactor();
    }

    // Parentheses
    if (token === '(') {
      index++;
      const res = parseExpression();
      if (tokens[index] === ')') {
        index++;
      }
      return res;
    }

    // String literal
    if (token.startsWith('"') && token.endsWith('"')) {
      index++;
      return token.substring(1, token.length - 1);
    }

    // Number literal
    if (!isNaN(Number(token))) {
      index++;
      return Number(token);
    }

    // Function call (e.g. SUM, AVERAGE)
    if (/^[A-Z_]+$/i.test(token) && tokens[index + 1] === '(') {
      const funcName = token.toUpperCase();
      index += 2; // skip FUNC and '('

      const args: (number | string | (number | string)[])[] = [];

      while (index < tokens.length && tokens[index] !== ')') {
        // Check if token is range e.g. A1:B10
        if (
          index + 2 < tokens.length &&
          /^[A-Z]+\d+$/i.test(tokens[index]) &&
          tokens[index + 1] === ':' &&
          /^[A-Z]+\d+$/i.test(tokens[index + 2])
        ) {
          const rangeStr = `${tokens[index]}:${tokens[index + 2]}`;
          index += 3;

          const cellIds = getCellsInRange(rangeStr);
          const rangeVals: (number | string)[] = [];
          for (const cid of cellIds) {
            const evaluated = evaluateCell(cid, gridData, new Set(visited));
            if (evaluated.startsWith('#')) {
              if (evaluated === '#CIRCULAR!') throw '#CIRCULAR!';
            } else if (evaluated !== '') {
              rangeVals.push(evaluated);
            }
          }
          args.push(rangeVals);
        } else {
          // Single argument expression
          const argVal = parseExpression();
          args.push(argVal);
        }

        if (tokens[index] === ',') {
          index++;
        }
      }

      if (tokens[index] === ')') {
        index++;
      }

      return evaluateFunction(funcName, args);
    }

    // Single Cell Reference e.g. A1
    if (/^[A-Z]+\d+$/i.test(token)) {
      index++;
      const cellId = token.toUpperCase();
      const evaluated = evaluateCell(cellId, gridData, new Set(visited));

      if (evaluated.startsWith('#')) {
        throw evaluated;
      }

      if (evaluated === '') return 0;
      const num = Number(evaluated);
      return isNaN(num) ? evaluated : num;
    }

    index++;
    throw '#NAME?';
  }

  return parseExpression();
}

/**
 * Tokenizer for formula strings
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < expr.length) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Two-character operators <=, >=, <>
    if (i + 1 < expr.length) {
      const doubleChar = expr.substring(i, i + 2);
      if (['<=', '>=', '<>'].includes(doubleChar)) {
        tokens.push(doubleChar);
        i += 2;
        continue;
      }
    }

    // Single-character operators / delimiters
    if (['+', '-', '*', '/', '^', '(', ')', ',', ':', '=', '>', '<'].includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }

    // String literals "text"
    if (char === '"') {
      let str = '"';
      i++;
      while (i < expr.length && expr[i] !== '"') {
        str += expr[i];
        i++;
      }
      if (i < expr.length) {
        str += '"';
        i++;
      }
      tokens.push(str);
      continue;
    }

    // Identifiers or Numbers
    let word = '';
    while (
      i < expr.length &&
      !/[\s\+\-\*\/\^\(\)\,:\=\>\<]/.test(expr[i])
    ) {
      word += expr[i];
      i++;
    }

    if (word) {
      tokens.push(word);
    }
  }

  return tokens;
}

/**
 * Built-in Function Evaluator
 */
function evaluateFunction(
  name: string,
  args: (number | string | (number | string)[])[]
): number | string {
  // Flatten array arguments (like ranges)
  const flatten = (arr: typeof args): (number | string)[] => {
    const result: (number | string)[] = [];
    arr.forEach(item => {
      if (Array.isArray(item)) {
        result.push(...item);
      } else {
        result.push(item);
      }
    });
    return result;
  };

  const numericVals = (arr: typeof args): number[] => {
    return flatten(arr)
      .map(v => Number(v))
      .filter(n => !isNaN(n));
  };

  switch (name) {
    case 'SUM': {
      const nums = numericVals(args);
      return nums.reduce((acc, curr) => acc + curr, 0);
    }

    case 'AVERAGE':
    case 'AVG': {
      const nums = numericVals(args);
      if (nums.length === 0) throw '#DIV/0!';
      return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
    }

    case 'COUNT': {
      return numericVals(args).length;
    }

    case 'COUNTA': {
      return flatten(args).filter(v => v !== null && v !== undefined && v !== '').length;
    }

    case 'MIN': {
      const nums = numericVals(args);
      if (nums.length === 0) return 0;
      return Math.min(...nums);
    }

    case 'MAX': {
      const nums = numericVals(args);
      if (nums.length === 0) return 0;
      return Math.max(...nums);
    }

    case 'MEDIAN': {
      const nums = numericVals(args).sort((a, b) => a - b);
      if (nums.length === 0) return 0;
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    }

    case 'PRODUCT': {
      const nums = numericVals(args);
      if (nums.length === 0) return 0;
      return nums.reduce((acc, curr) => acc * curr, 1);
    }

    case 'CONCATENATE':
    case 'CONCAT': {
      return flatten(args).join('');
    }

    case 'IF': {
      const cond = Number(args[0]);
      const valTrue = args[1] !== undefined ? args[1] : 1;
      const valFalse = args[2] !== undefined ? args[2] : 0;
      return cond ? (Array.isArray(valTrue) ? valTrue[0] : valTrue) : (Array.isArray(valFalse) ? valFalse[0] : valFalse);
    }

    case 'UPPER': {
      const str = String(flatten(args)[0] || '');
      return str.toUpperCase();
    }

    case 'LOWER': {
      const str = String(flatten(args)[0] || '');
      return str.toLowerCase();
    }

    case 'LEN': {
      const str = String(flatten(args)[0] || '');
      return str.length;
    }

    case 'ROUND': {
      const num = Number(flatten(args)[0] || 0);
      const decimals = Number(flatten(args)[1] || 0);
      if (isNaN(num) || isNaN(decimals)) throw '#VALUE!';
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    }

    case 'ABS': {
      const num = Number(flatten(args)[0] || 0);
      if (isNaN(num)) throw '#VALUE!';
      return Math.abs(num);
    }

    case 'SQRT': {
      const num = Number(flatten(args)[0] || 0);
      if (isNaN(num) || num < 0) throw '#NUM!';
      return Math.sqrt(num);
    }

    case 'POWER': {
      const base = Number(flatten(args)[0] || 0);
      const exp = Number(flatten(args)[1] || 0);
      if (isNaN(base) || isNaN(exp)) throw '#VALUE!';
      return Math.pow(base, exp);
    }

    case 'NOW': {
      return new Date().toLocaleString();
    }

    case 'TODAY': {
      return new Date().toLocaleDateString();
    }

    default:
      throw '#NAME?';
  }
}

/**
 * Adjusts cell references in a formula string when copying or auto-filling (e.g. "=A1+B1" offset by row +1 becomes "=A2+B2")
 */
export function adjustFormulaReferences(
  formula: string,
  deltaRow: number,
  deltaCol: number
): string {
  if (!formula.startsWith('=')) return formula;

  // Match cell references like A1 or A1:B10, ignoring strings in quotes
  return formula.replace(/(?:"[^"]*")|([A-Z]+)(\d+)/gi, (match, colStr, rowStr) => {
    if (!colStr || !rowStr) return match; // Inside quotes

    const coords = cellIdToCoords(`${colStr}${rowStr}`);
    if (!coords) return match;

    const newCol = Math.max(0, coords.col + deltaCol);
    const newRow = Math.max(0, coords.row + deltaRow);

    return coordsToCellId(newCol, newRow);
  });
}
