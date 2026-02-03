export interface Band {
  id: string;
  name: string;
  province: string;
  city?: string;
  genres: string[];
  description: string;
  links: { type: string; url: string }[];
  imageUrl?: string;
  yearFormed?: number;
  featured?: boolean;
}

export const genres = [
  {
    id: 'post-rock',
    name: 'Post-rock',
    primaryColor: '#627d98',
    secondaryColor: '#486581',
    accentColor: '#9fb3c8',
  },
  {
    id: 'shoegaze',
    name: 'Shoegaze',
    primaryColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    accentColor: '#a78bfa',
  },
];

export const bands: Band[] = [
  {
    id: '1',
    name: '惘闻',
    province: '辽宁',
    city: '大连',
    genres: ['post-rock'],
    description: '中国后摇领军乐队',
    links: [{ type: 'bandcamp', url: 'https://wangwen.bandcamp.com' }],
    yearFormed: 1999,
  },
  {
    id: '2',
    name: '重塑雕像的权利',
    province: '北京',
    genres: ['post-rock', 'shoegaze'],
    description: '中国后摇先驱乐队',
    links: [{ type: 'spotify', url: 'https://spotify.com' }],
    yearFormed: 2003,
  },
  {
    id: '3',
    name: '沼泽',
    province: '广东',
    city: '广州',
    genres: ['post-rock'],
    description: '融合古琴的后摇乐队',
    links: [{ type: 'weibo', url: 'https://weibo.com' }],
    yearFormed: 2001,
  },
  {
    id: '4',
    name: '文雀',
    province: '北京',
    genres: ['post-rock'],
    description: '北京后摇代表乐队',
    links: [{ type: 'bandcamp', url: 'https://magpie.bandcamp.com' }],
    yearFormed: 2008,
  },
  {
    id: '5',
    name: '梅卡德尔',
    province: '广东',
    city: '广州',
    genres: ['post-rock', 'shoegaze'],
    description: '广州后摇新锐',
    links: [{ type: 'weibo', url: 'https://weibo.com' }],
    yearFormed: 2014,
  },
];

export const provinces = [
  '北京', '天津', '上海', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '海南',
  '四川', '贵州', '云南', '陕西', '甘肃',
  '青海', '内蒙古', '广西', '西藏', '宁夏', '新疆',
  '香港', '澳门', '台湾',
];
