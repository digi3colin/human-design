const ENGLISH_NAMES = [
  "The Creative", "The Receptive", "Difficulty at the Beginning", "Youthful Folly",
  "Waiting", "Conflict", "The Army", "Holding Together", "The Taming Power of the Small",
  "Treading", "Peace", "Standstill", "Fellowship", "Possession in Great Measure", "Modesty",
  "Enthusiasm", "Following", "Work on What Has Been Spoiled", "Approach", "Contemplation",
  "Biting Through", "Grace", "Splitting Apart", "Return", "Innocence", "The Taming Power of the Great",
  "Nourishment", "Preponderance of the Great", "The Abysmal", "The Clinging", "Influence", "Duration",
  "Retreat", "The Power of the Great", "Progress", "Darkening of the Light", "The Family", "Opposition",
  "Obstruction", "Deliverance", "Decrease", "Increase", "Breakthrough", "Coming to Meet", "Gathering Together",
  "Pushing Upward", "Oppression", "The Well", "Revolution", "The Cauldron", "The Arousing", "Keeping Still",
  "Development", "The Marrying Maiden", "Abundance", "The Wanderer", "The Gentle", "The Joyous", "Dispersion",
  "Limitation", "Inner Truth", "Preponderance of the Small", "After Completion", "Before Completion",
];

const CHINESE_NAMES = [
  "乾", "坤", "屯", "蒙", "需", "訟", "師", "比", "小畜", "履", "泰", "否", "同人", "大有", "謙", "豫",
  "隨", "蠱", "臨", "觀", "噬嗑", "賁", "剝", "復", "無妄", "大畜", "頤", "大過", "坎", "離", "咸", "恆",
  "遯", "大壯", "晉", "明夷", "家人", "睽", "蹇", "解", "損", "益", "夬", "姤", "萃", "升", "困", "井",
  "革", "鼎", "震", "艮", "漸", "歸妹", "豐", "旅", "巽", "兌", "渙", "節", "中孚", "小過", "既濟", "未濟",
];

export function getHexagram(gate) {
  const number = Number(gate);
  const index = Math.max(0, Math.min(63, number - 1));

  return {
    number,
    symbol: String.fromCodePoint(0x4dc0 + index),
    chinese: CHINESE_NAMES[index],
    english: ENGLISH_NAMES[index],
  };
}
