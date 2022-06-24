type Messages = {
  [key: string]: string;
};

export type MessagesGroup = {
  [group: string]: Messages;
};

export type Replacements = {
  [key: string]: string | number;
};

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export default class Lang {
  private groups!: Array<string>;
  private messagesGroups!: MessagesGroup;

  constructor(messagesGroup?: MessagesGroup) {
    // @ts-ignore
    const globalMessages: MessagesGroup | undefined = (window as any)?.messages;

    if (isDefined(messagesGroup)) {
      this.setMessages(messagesGroup);
    } else if (isDefined(globalMessages)) {
      this.setMessages(globalMessages);
    } else {
      throw new Error(
        'Please provide translation messages either in the constructor params or window.messages',
      );
    }
  }

  /**
   * Set messages groups source.
   */
  setMessages(messagesGroup: MessagesGroup) {
    this.messagesGroups = messagesGroup;

    this.groups = Object.keys(this.messagesGroups || {messages: true});
  }

  /**
   * Parse a message key into components.
   */
  private parseKey(key: string): {
    group: keyof MessagesGroup;
    entry: string;
  } {
    const segments = key.split('.');

    // We will now check if the first segment is on this.groups.
    const explicitGroup = this.groups.indexOf(segments[0]) >= 0;

    // If the group is not present (implicit), means we have to use messagesGroups.
    const group = explicitGroup ? segments[0] : 'messages';

    // For the entry, if we had a explicit group, we have to ignore the first
    // segment, but if it was implicit, means the whole key is the entry.
    const entry = explicitGroup ? segments.slice(1).join('.') : key;

    return {
      group: group,
      entry: entry,
    };
  }

  /**
   * Returns a translation message. Use `Lang.get()` method instead, this methods assumes the key exists.
   *
   */
  private getMessage(key: string) {
    const parsedKey = this.parseKey(key);

    // Get message text.
    const group = this.messagesGroups[parsedKey.group];

    // Ensure message source exists.
    if (typeof group === 'undefined') {
      return null;
    }

    const message = group[parsedKey.entry];

    if (typeof message !== 'string') {
      return null;
    }

    return message;
  }

  /**
   * Returns safely the translated string.
   *
   * It means it won't break in case `messagesGroups` property is not set.
   */
  private safeGetMessage(key: string) {
    if (!this.messagesGroups) {
      return null;
    }
    return this.getMessage(key);
  }

  /**
   * Apply replacements to a string message containing placeholders.
   *
   * @param message {string} The text message.
   * @param replacements {object} The replacements to be done in the message.
   *
   * @return {string} The string message with replacements applied.
   */
  applyReplacements(message: string, replacements: Replacements) {
    for (const replace in replacements) {
      message = message
        .split(':' + replace)
        .join(replacements[replace].toString());
    }
    return message;
  }

  /**
   * Checks if the given `count` is within the interval defined by the {string} `interval`
   *
   * @param  count {int}  The amount of items.
   * @param  interval {string}    The interval to be compared with the count.
   * @return {boolean}    Returns true if count is within interval; false otherwise.
   */
  private testInterval(count: number, interval: string) {
    /**
     * From the Symfony\Component\Translation\Interval Docs
     *
     * Tests if a given number belongs to a given math interval.
     * An interval can represent a finite set of numbers: {1,2,3,4}
     * An interval can represent numbers between two numbers: [1, +Inf] ]-1,2[
     * The left delimiter can be [ (inclusive) or ] (exclusive).
     * The right delimiter can be [ (exclusive) or ] (inclusive).
     * Beside numbers, you can use -Inf and +Inf for the infinite.
     */
    const numbers = this.parseNumbersFromInterval(interval);

    const types = {
      setOfNumbers: /^\{.*\}$/,
      bothExclusive: /^(\(|\]|\)).*(\)|\[|\()$/,
      bothInclusive: /^\[.*\]$/,
      leftInclusive: /^\[.*(\)|\[|\()$/,
      rightInclusive: /^(\(|\]|\)).*\]$/,
    };

    if (interval.match(types.setOfNumbers)) {
      return numbers.indexOf(count) !== -1;
    }

    if (interval.match(types.bothInclusive)) {
      return count >= numbers[0] && count <= numbers[1];
    }

    if (interval.match(types.bothExclusive)) {
      return count > numbers[0] && count < numbers[1];
    }

    if (interval.match(types.rightInclusive)) {
      return count > numbers[0] && count <= numbers[1];
    }

    if (interval.match(types.leftInclusive)) {
      return count >= numbers[0] && count < numbers[1];
    }
  }

  /**
   * Parse a given string (number, +Inf, -Inf, Inf) to Number
   */
  private parseNumber(str: string) {
    const strToParse = String(str).replace(/(\*|Inf)\s*?$/i, 'Infinity');
    return Number(strToParse);
  }

  /**
   * Parse an interval to array.
   */
  private parseNumbersFromInterval(interval: string) {
    const braces = /\[|\]|\{|\}/g;
    const numbers = interval.replace(braces, '').split(/,\s?/);
    const newNumbers = [];

    for (const i in numbers) {
      newNumbers.push(this.parseNumber(numbers[i]));
    }

    return newNumbers;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private applyPluralization(key: string, message: string, count: number) {
    /**
     * Explanation of this rule
     * (
     *   \s? // Has into account any space before the explicit rule
     *   (
     *     [{[\]][0-9,\s*\-+Inf]+[}[\]] // This hopefullt captures all possible cases {1} {1,2}, [0-1], [0,+Inf], ]-Inf,5[
     *   )
     *   (
     *     [^|]+ // This captures everything in between the plural rule (e.g. {0}) and the "|" (or end of the string)
     *   )
     * )
     * (?=\|?) // This defines that the capturing should stop on each | or end of the string (without capturing).
     *
     * @see {@link https://regex101.com/r/QjdBQN/1}
     */
    const regex = /(\s?([{[\]][0-9,\s*\-+Inf]+[}[\]])?([^|]+))(?=\|?)/g;
    const regexMessageParts = message.matchAll(regex);

    // Get the explicit rules, If any
    const explicitRules: Array<string> = [];
    const messageParts = [];

    let i = 0;
    for (const match of regexMessageParts) {
      const matches = match.slice(2);
      if (typeof matches[0] !== 'undefined') {
        explicitRules[i] = matches[0].trim();
      }
      messageParts[i] = matches[1].trim();
      i += 1;
    }

    // Well, if it didn't iterate through any item, then there are no matches / placeholders.
    const hasAnInvalidExplicitRule =
      // @ts-ignore
      explicitRules.length > 0 && explicitRules.includes(undefined);
    if (i === 0 || hasAnInvalidExplicitRule) {
      if (hasAnInvalidExplicitRule) {
        console.warn(
          `The key ${key} may contain an invalid explicit rule within this message: ${message}`,
        );
      }
      return message;
    }

    // Check the explicit rules
    for (let index = 0; index < explicitRules.length; index++) {
      if (
        explicitRules[index] &&
        this.testInterval(count, explicitRules[index])
      ) {
        return messageParts[index];
      }
    }

    // Standard rules
    if (
      (typeof count === 'number' && count > 1) ||
      (typeof count === 'object' && count[Object.keys(count)[0]] > 1)
    ) {
      return messageParts[1] ?? messageParts[0];
    }

    return messageParts[0];
  }

  /**
   * Returns a translation message. Now also with .choice functionality if there is a pipe in the message.
   *
   * @param key {string} The key of the message.
   * @param replacements {object} The replacements to be done in the message.
   * @param count {number} In case it's a choice replacement.
   *
   * @return {string} The translation message, if not found the given key.
   */
  get(key: string, replacements?: Replacements, count?: number) {
    const message = this.safeGetMessage(key);

    if (!isDefined(message)) {
      return key;
    }

    let finalCount = count ?? 0;

    // Set default value for count.
    if (!isDefined(count) && typeof replacements?.count === 'number') {
      finalCount = replacements.count;
    }

    if (replacements) {
      return this.applyReplacements(
        this.applyPluralization(key, message, finalCount),
        replacements,
      );
    }

    return this.applyPluralization(key, message, finalCount);
  }

  /**
   * Returns true if the key is defined on the messagesGroups source.
   */
  has(key: string) {
    return this.safeGetMessage(key) !== null;
  }

  /**
   * Gets the plural or singular form of the message specified based on an integer value.
   *
   * @return {string} The translation message according to an integer value.
   */
  choice(key: string, count: number, replacements?: Replacements) {
    // Set default values for parameters replace and locale
    replacements = typeof replacements !== 'undefined' ? replacements : {};

    // The count must be replaced if found in the message
    replacements.count = count;

    // Message to get the plural or singular
    return this.get(key, replacements, count);
  }

  isReactNative(): boolean {
    // @ts-ignore
    return window?.navigator?.product === 'ReactNative';
  }

  isNode(): boolean {
    return typeof global !== 'undefined' && !this.isReactNative();
  }
}
