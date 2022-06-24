import Lang from './lang';

const messages = {
  messages: {
    hi: 'Hello!',
    greeting: 'Hi :name',
    'test-with-replacements': 'Hello :partial',
    'test-with-replacements-2': 'Hello ( :partial )',
    'test-with-pluralization':
      '{0}No apple|{1}one apple|[2,4]two to four apples|{5} five apples|[6,*]more than six apples',
    'test-with-count':
      '{0}:countth|{1}:countst|{2}:countnd|{3}:countrd|[4,*]:countth',
    'test-with-pluralization-and-replacement':
      '{1}One apple - :value|[2,*] More than one, - :value',
  },
};

describe('Lang package', () => {
  describe('setup', () => {
    it('should be able to pass messages in the constructor params', () => {
      const lang = new Lang(messages);
      expect(lang.get('hi')).toEqual(messages.messages.hi);
    });

    it('should be able to initialize messages with window.messages', () => {
      // @ts-ignored
      window.messages = messages;
      const lang = new Lang();
      expect(lang.get('hi')).toEqual(messages.messages.hi);

      // @ts-ignored
      window.messages = undefined;
    });
  });

  describe('get', () => {
    it('should return the key when the key is not in the messages', () => {
      const lang = new Lang({});
      const key = 'non-existent-key';
      expect(lang.get(key)).toEqual(key);
    });

    it('should apply replacements', () => {
      const lang = new Lang(messages);

      expect(lang.get('test-with-replacements', {partial: 'world!'})).toBe(
        'Hello world!',
      );

      expect(lang.get('test-with-replacements-2', {partial: 'world!'})).toBe(
        'Hello ( world! )',
      );
    });

    it('should support pluralization', () => {
      const lang = new Lang(messages);
      const key = 'test-with-pluralization';

      expect(lang.get(key, {}, 1)).toBe('one apple');
      expect(lang.get(key, {}, 10)).toBe('more than six apples');
    });

    it('should support combination of pluralization and replacement', () => {
      const lang = new Lang(messages);
      const key = 'test-with-pluralization-and-replacement';

      expect(lang.get(key, {value: 'Yeaah'}, 1)).toBe('One apple - Yeaah');
      expect(lang.get(key, {value: 'Hooraay'}, 10)).toBe(
        'More than one, - Hooraay',
      );
    });

    it('should support `count` in replacements', () => {
      const lang = new Lang(messages);
      const key = 'test-with-count';

      expect(lang.get(key, {count: 1})).toBe('1st');
      expect(lang.get(key, {count: 2})).toBe('2nd');
      expect(lang.get(key, {count: 3})).toBe('3rd');
      expect(lang.get(key, {count: 4})).toBe('4th');
    });
  });

  describe('choice', () => {
    it('should apply pluralization', () => {
      const lang = new Lang(messages);
      const key = 'test-with-pluralization';

      expect(lang.choice(key, 0)).toBe('No apple');

      expect(lang.choice(key, 1)).toBe('one apple');

      expect(lang.choice(key, 2)).toBe('two to four apples');

      expect(lang.choice(key, 3)).toBe('two to four apples');

      expect(lang.choice(key, 5)).toBe('five apples');

      expect(lang.choice(key, 100)).toBe('more than six apples');
    });

    it('should apply pluralization and replacement', () => {
      const lang = new Lang(messages);
      const key = 'test-with-pluralization-and-replacement';

      expect(lang.choice(key, 1, {value: 'Hooray'})).toBe('One apple - Hooray');
      expect(lang.choice(key, 10, {value: 'yeaaaah'})).toBe(
        'More than one, - yeaaaah',
      );
    });
  });
});
