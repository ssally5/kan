// Curated prototype fixtures; replace through the dictionary service slice.
export const words = [
['学习', '學習', 'xué xí', 'to study; to learn', 1, '学习让生活更有意思。', 'Learning makes life more interesting.'],
['你好', '你好', 'nǐ hǎo', 'hello; hi', 1, '你好，很高兴认识你。', 'Hello, nice to meet you.'],
['喜欢', '喜歡', 'xǐ huān', 'to like; to be fond of', 1, '我喜欢学习中文。', 'I like learning Chinese.'],
['一起', '一起', 'yì qǐ', 'together; in the same place', 2, '我们一起去学校。', 'Let’s go to school together.'],
['发现', '發現', 'fā xiàn', 'to discover; to find', 3, '我发现了一本好书。', 'I found a good book.'],
['慢慢', '慢慢', 'màn màn', 'slowly; little by little', 3, '慢慢来，不着急。', 'Take your time; there’s no rush.'],
['今天', '今天', 'jīn tiān', 'today', 1, '今天天气很好。', 'The weather is nice today.'],
['我们', '我們', 'wǒ men', 'we; us', 1, '我们一起学习中文。', 'We study Chinese together.'],
['去', '去', 'qù', 'to go', 1, '我去学校。', 'I go to school.'],
['吃饭', '吃飯', 'chī fàn', 'to eat; to have a meal', 1, '我们一起吃饭。', 'We eat together.'],
['学校', '學校', 'xué xiào', 'school', 1, '我喜欢我的学校。', 'I like my school.'],
['中文', '中文', 'zhōng wén', 'Chinese language', 1, '我学习中文。', 'I study Chinese.'],
['明天', '明天', 'míng tiān', 'tomorrow', 1, '明天我们一起去学校。', 'Tomorrow we’ll go to school together.'],
['朋友', '朋友', 'péng you', 'friend', 1, '他是我的朋友。', 'He is my friend.'],
['旅行', '旅行', 'lǚ xíng', 'to travel; a journey', 2, '我喜欢旅行。', 'I like traveling.'],
['咖啡', '咖啡', 'kā fēi', 'coffee', 2, '我喜欢喝咖啡。', 'I like drinking coffee.'],
['坚持', '堅持', 'jiān chí', 'to persist; to keep at', 4, '坚持每天学习。', 'Keep studying every day.'],
['收获', '收穫', 'shōu huò', 'harvest; to gain', 4, '每天都有新的收获。', 'Every day brings something new.'],
['憧憬', '憧憬', 'chōng jǐng', 'to look forward to; to long for', 5, '我憧憬未来的生活。', 'I look forward to life in the future.'],
['潜移默化', '潛移默化', 'qián yí mò huà', 'to influence subtly and gradually', 6, '阅读潜移默化地影响着我们。', 'Reading gradually influences us.']
].map((w, id) => ({id, ch:w[0], tr:w[1], py:w[2], en:w[3], hsk:w[4], ex:w[5], translation:w[6]}));
export const layouts = [['Chinese', ['ch'], ['py', 'en']], ['Pinyin', ['py'], ['ch', 'en']], ['English', ['en'], ['ch', 'py']], ['Chinese + Pinyin', ['ch', 'py'], ['en']], ['Chinese + English', ['ch', 'en'], ['py']], ['Pinyin + English', ['py', 'en'], ['ch']]];
export const freshState = () => ({
  saved:new Set([0, 2, 3, 4, 6, 7, 10, 11, 14, 15, 16, 17]),
  folders:[{id:1, name:'Everyday essentials', words:[0, 2, 3, 6, 7, 10, 11]}, {id:2, name:'Out & about', words:[3, 14, 15]}, {id:3, name:'Words to remember', words:[4, 16, 17]}],
  review:Object.fromEntries([0, 2, 3, 4, 6, 7].map((id, i) => [id, {level:i%3, due:0}])),
  completed:[],
  history:[]
});
