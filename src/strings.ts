import {curry} from './functions'

const asciiWords = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g

const unicodeWords = /[A-Z\xc0-\xd6\xd8-\xde]?[a-z\xdf-\xf6\xf8-\xff]+(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf \t\x0b\f\xa0\n\r]|[A-Z\xc0-\xd6\xd8-\xde]|$)|(?:[A-Z\xc0-\xd6\xd8-\xde])+(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf \t\x0b\f\xa0\n\r]|[A-Z\xc0-\xd6\xd8-\xde](?:[a-z\xdf-\xf6\xf8-\xff])|$)|[A-Z\xc0-\xd6\xd8-\xde]?(?:[a-z\xdf-\xf6\xf8-\xff])+|[A-Z\xc0-\xd6\xd8-\xde]+|\d+/g
const hasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/

/***
 * Spit string into words
 * @param str The string to split
 * @returns {RegExpMatchArray|[]} Matched words
 */
export function words (str?: string | null): string[] {
  return (str && str.match(hasUnicodeWord.test(str) ? unicodeWords : asciiWords)) || []
}

function mapWords (str: string, wordMapFn: (word: string, i: number) => string | undefined, join: string = ''): string {
  return words(str).map(wordMapFn).join(join)
}

/***
 * Convert string to lowerCase
 * @param s The string to convert
 * @returns {string} Returns string in lowercase
 */
export function lowerCase (s: string) {
  return s.toLowerCase()
}

function caseStr (casing: string, str: string): string {
  return mapWords(str, lowerCase, casing)
}

/***
 * Convert string to kebab-case
 * @param s The string to convert
 * @returns {string} Returns string in kebab-case
 */
export const kebabCase = curry(caseStr)('-')

/***
 * Convert string to snake_case
 * @param s The string to convert
 * @returns {string} Returns string in snake_case
 */
export const snakeCase = curry(caseStr)('_')

/***
 * Capitalize first char of string
 * @param str
 * @returns {string} Returns string with first char capitalized
 */
export function capitalize (str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

/***
 * Convert string to camelCase
 * @param str The string to convert
 * @returns {string} Returns string in camelCase
 */
export function camelCase (str: string): string {
  return mapWords(str, (word, i) => {
    word = lowerCase(word)
    return i === 0 ? word : capitalize(word!)
  })
}

/***
 * Removes leading and trailing whitespace or specified characters from string.
 * @param str The string to trim.
 * @returns {string} Trimmed string
 */
export function trim (str: string) {
  return str.trim()
}

/***
 * Convert wildcard string to RegExp. Like `hel*o` becames `/hel.*o/`
 * @param wildcardPattern pattern to convert
 * @param flags flags for created regex 'igm'
 * @returns {RegExp} Constructed regexp
 */
export function wildcardToRegExp (wildcardPattern: string, flags?: string): RegExp {
  const regexMatch = /^\/(.+)\/([im]+)?$/.exec(wildcardPattern)
  if (regexMatch) {
    return new RegExp(regexMatch[1], regexMatch[2] || flags)
  }
  const pattern = wildcardPattern
    .replace(/[\-\[\]\/{}()?.\\^$|]/g, '\\$&')
    .replace(/\*/g, '.*?')
    .replace(/\+/g, '.+?')
  return new RegExp(`^${pattern}$`, flags)
}

/***
 * Compile string template into template function.
 * Template language is similar to template strings in es6 `Hello ${name}`.
 * Doesn't support anything but property name inside `${}`
 * @example Use `template('Hello ${name}')(templateObject({name:'Bob'}))==='Hello Bob'`
 * @param template The template string
 * @returns {(data:<T>(key: keyof T) => string)=>string} Compiled template function.
 */
export function template<T> (template: string): (data: (key: string) => T) => string[] {
  const sanitized = template.split(/(\${([\s]*[^;\s{]+[\s]*)})/g)

  let fn = 'return ['
  for (let i = 0; i < sanitized.length; i++) {
    if (sanitized[i][0] === '$') {
      fn += `$d('${sanitized[++i]}'),`
    } else {
      fn += `"${sanitized[i].replace('"', '\\"')}",`
    }
  }
  return Function('$d', `${fn}]`) as (data: (key: string) => T) => string[]
}

/***
 * Function to use with `template` return object keys by template key
 * @param value
 * @param nullValue
 * @returns {(key:keyof T)=>string?}
 */
export function templateObject<T> (value: { [key: string]: T }, nullValue?: T): (key: string) => T {
  return function (key: string): T {
    return value[key] || nullValue
  }
}
