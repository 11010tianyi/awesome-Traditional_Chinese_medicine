const YD = "国家药典委员会《中华人民共和国药典》2020年版一部，中国医药科技出版社";
const SHL = "https://zh.wikisource.org/wiki/傷寒論";
const JG = "https://zh.wikisource.org/wiki/金匱要略";

function yd(item, detail, url) {
  return { source: YD, item, detail, ...(url ? { url } : {}) };
}

function book(title, url, detail) {
  return { title, url, detail };
}

export const formulaCorrections = [
  {
    name: "桂枝汤",
    herbs: ["桂枝", "白芍", "生姜", "甘草", "大枣"],
    notes: "原目录缺大枣。维基文库《伤寒论》桂枝汤方为桂枝、芍药、甘草、生姜、大枣；目录中的芍药用白芍。",
    references: [book("伤寒论·桂枝汤方", SHL, "桂枝三两、芍药三两、甘草二两、生姜三两、大枣十二枚")]
  },
  {
    name: "四君子汤",
    herbs: ["人参", "白术", "茯苓", "甘草"],
    notes: "原目录只剩人参、甘草。补回《太平惠民和剂局方》四君子汤的白术、茯苓。",
    references: [book("太平惠民和剂局方·四君子汤", "", "人参、白术、茯苓、甘草")]
  },
  {
    name: "黄连解毒汤",
    herbs: ["黄连", "黄芩", "黄柏", "栀子"],
    notes: "原目录作黄连、黄芩、甘草。改为《外台秘要》引崔氏方的黄连、黄芩、黄柏、栀子。",
    references: [book("外台秘要引崔氏方·黄连解毒汤", "", "黄连、黄芩、黄柏、栀子")]
  }
];

export const formulaSeeds = [
  { name: "银翘散", pinyin: "YinQiaoSan", source: "温病条辨", indication: "风热表证、温病初起", herbs: ["金银花", "连翘", "薄荷", "荆芥", "牛蒡子", "桔梗", "甘草", "淡豆豉", "竹叶", "芦根"], tags: ["风热", "清热解毒"], references: [book("温病条辨·银翘散", "", "吴瑭方，药味沿用既有目录")] },
  { name: "麻黄汤", pinyin: "MaHuangTang", source: "伤寒论", indication: "外感风寒表实证", herbs: ["麻黄", "桂枝", "杏仁", "甘草"], tags: ["解表", "风寒"], references: [book("伤寒论·麻黄汤方", SHL, "麻黄、桂枝、甘草、杏仁")] },
  { name: "桂枝汤", pinyin: "GuiZhiTang", source: "伤寒论", indication: "外感风寒表虚证", herbs: ["桂枝", "白芍", "生姜", "甘草", "大枣"], tags: ["解表", "调和营卫"], references: [book("伤寒论·桂枝汤方", SHL, "桂枝、芍药、甘草、生姜、大枣")] },
  { name: "四君子汤", pinyin: "SiJunZiTang", source: "太平惠民和剂局方", indication: "脾胃气虚证", herbs: ["人参", "白术", "茯苓", "甘草"], tags: ["补气", "脾胃"], references: [book("太平惠民和剂局方·四君子汤", "", "人参、白术、茯苓、甘草")] },
  { name: "黄连解毒汤", pinyin: "HuangLianJieDuTang", source: "外台秘要", indication: "三焦火毒热盛", herbs: ["黄连", "黄芩", "黄柏", "栀子"], tags: ["清热解毒"], references: [book("外台秘要引崔氏方", "", "黄连、黄芩、黄柏、栀子")] },
  { name: "六味地黄丸", pinyin: "LiuWeiDiHuangWan", source: "小儿药证直诀", indication: "肾阴虚证", herbs: ["熟地黄", "山茱萸", "山药", "泽泻", "牡丹皮", "茯苓"], tags: ["补阴", "肾"] },
  { name: "逍遥散", pinyin: "XiaoYaoSan", source: "太平惠民和剂局方", indication: "肝郁血虚脾弱证", herbs: ["柴胡", "当归", "白芍", "白术", "茯苓", "甘草", "薄荷", "生姜"], tags: ["疏肝", "养血"] },
  { name: "补中益气汤", pinyin: "BuZhongYiQiTang", source: "脾胃论", indication: "脾胃气虚、中气下陷", herbs: ["黄芪", "人参", "白术", "甘草", "当归", "陈皮", "升麻", "柴胡"], tags: ["补气", "脾胃"] },
  { name: "小柴胡汤", pinyin: "XiaoChaiHuTang", source: "伤寒论", indication: "少阳证", herbs: ["柴胡", "黄芩", "半夏", "生姜", "人参", "甘草", "大枣"], tags: ["和解少阳"] },
  { name: "白虎汤", pinyin: "BaiHuTang", source: "伤寒论", indication: "气分热盛证", herbs: ["石膏", "知母", "甘草", "粳米"], tags: ["清热", "气分"] },
  { name: "龙胆泻肝汤", pinyin: "LongDanXieGanTang", source: "医方集解", indication: "肝胆实火、湿热下注", herbs: ["龙胆草", "黄芩", "栀子", "泽泻", "木通", "车前子", "当归", "生地黄", "柴胡", "甘草"], tags: ["清肝", "利湿"], notes: "木通用药典木通科木通，不用马兜铃科关木通。" },
  { name: "血府逐瘀汤", pinyin: "XueFuZhuYuTang", source: "医林改错", indication: "胸中血瘀证", herbs: ["桃仁", "红花", "当归", "生地黄", "川芎", "赤芍", "牛膝", "桔梗", "柴胡", "枳壳", "甘草"], tags: ["活血化瘀"] },
  { name: "半夏泻心汤", pinyin: "BanXiaXieXinTang", source: "伤寒论", indication: "寒热错杂之痞证", herbs: ["半夏", "黄芩", "干姜", "人参", "黄连", "大枣", "甘草"], tags: ["和胃", "寒热错杂"] },
  { name: "藿香正气散", pinyin: "HuoXiangZhengQiSan", source: "太平惠民和剂局方", indication: "外感风寒、内伤湿滞", herbs: ["藿香", "紫苏叶", "白芷", "大腹皮", "茯苓", "白术", "陈皮", "半夏", "厚朴", "桔梗", "甘草"], tags: ["解表", "化湿"] },
  { name: "二陈汤", pinyin: "ErChenTang", source: "太平惠民和剂局方", indication: "湿痰证", herbs: ["半夏", "橘红", "茯苓", "甘草", "生姜", "乌梅"], tags: ["燥湿化痰"] },
  { name: "平胃散", pinyin: "PingWeiSan", source: "太平惠民和剂局方", indication: "湿滞脾胃证", herbs: ["苍术", "厚朴", "陈皮", "甘草"], tags: ["燥湿", "行气"] },
  { name: "归脾汤", pinyin: "GuiPiTang", source: "正体类要", indication: "心脾气血两虚", herbs: ["白术", "茯神", "黄芪", "龙眼肉", "酸枣仁", "人参", "木香", "甘草", "当归", "远志", "生姜", "大枣"], tags: ["补益", "心脾"] },
  { name: "温胆汤", pinyin: "WenDanTang", source: "三因极一病证方论", indication: "胆胃不和、痰热内扰", herbs: ["半夏", "竹茹", "枳实", "陈皮", "甘草", "茯苓", "生姜", "大枣"], tags: ["化痰", "清胆"] },
  { name: "四物汤", pinyin: "SiWuTang", source: "仙授理伤续断秘方", indication: "营血虚滞证", herbs: ["熟地黄", "当归", "白芍", "川芎"], tags: ["补血"] },
  { name: "四逆散", pinyin: "SiNiSan", source: "伤寒论", indication: "阳郁厥逆、肝脾气郁", herbs: ["柴胡", "白芍", "枳实", "甘草"], tags: ["疏肝理脾"] },
  { name: "葛根芩连汤", pinyin: "GeGenQinLianTang", source: "伤寒论", indication: "表证未解、里热下利", herbs: ["葛根", "黄芩", "黄连", "甘草"], tags: ["解表清里"], references: [book("伤寒论·葛根黄芩黄连汤方", SHL, "葛根、甘草、黄芩、黄连")] },
  { name: "大承气汤", pinyin: "DaChengQiTang", source: "伤寒论", indication: "阳明腑实证", herbs: ["大黄", "厚朴", "枳实", "芒硝"], tags: ["攻下"], references: [book("伤寒论·大承气汤方", SHL, "大黄、厚朴、枳实、芒硝")] },
  { name: "桃红四物汤", pinyin: "TaoHongSiWuTang", source: "医宗金鉴", indication: "血虚兼血瘀证", herbs: ["桃仁", "红花", "熟地黄", "当归", "白芍", "川芎"], tags: ["养血", "活血"] },
  {
    name: "清营汤",
    pinyin: "QingYingTang",
    source: "温病条辨",
    indication: "热入营分证",
    herbs: ["犀角", "生地黄", "玄参", "竹叶", "麦冬", "丹参", "黄连", "金银花", "连翘"],
    tags: ["清营", "解毒"],
    notes: "犀角为历史方原文用药，不作为可新增药材收录。现行处方以水牛角代替，见本目录“水牛角”。"
  },
  { name: "酸枣仁汤", pinyin: "SuanZaoRenTang", source: "金匮要略", indication: "肝血不足、虚热内扰", herbs: ["酸枣仁", "甘草", "知母", "茯苓", "川芎"], tags: ["安神"], references: [book("金匮要略", JG, "酸枣仁汤主治虚劳虚烦不得眠")] },
  { name: "葛根汤", pinyin: "GeGenTang", source: "伤寒论", indication: "风寒表实、项背强几几", herbs: ["葛根", "麻黄", "桂枝", "白芍", "生姜", "甘草", "大枣"], tags: ["解表", "太阳"], notes: "原文芍药，目录用白芍。", references: [book("伤寒论·葛根汤方", SHL, "葛根、麻黄、桂枝、生姜、甘草、芍药、大枣")] },
  { name: "麻杏石甘汤", pinyin: "MaXingShiGanTang", source: "伤寒论", indication: "肺热咳喘", herbs: ["麻黄", "杏仁", "甘草", "石膏"], tags: ["清热", "宣肺"], notes: "全称麻黄杏仁甘草石膏汤。", references: [book("伤寒论·麻黄杏仁甘草石膏汤方", SHL, "麻黄、杏仁、甘草、石膏")] },
  { name: "四逆汤", pinyin: "SiNiTang", source: "伤寒论", indication: "少阴病阳虚寒厥", herbs: ["附子", "干姜", "甘草"], tags: ["回阳救逆"], references: [book("伤寒论·四逆汤方", SHL, "甘草、干姜、生附子")] },
  { name: "理中丸", pinyin: "LiZhongWan", source: "伤寒论", indication: "中焦虚寒", herbs: ["人参", "干姜", "白术", "甘草"], tags: ["温中"], references: [book("伤寒论·理中丸方", SHL, "人参、干姜、甘草、白术")] },
  { name: "真武汤", pinyin: "ZhenWuTang", source: "伤寒论", indication: "阳虚水泛", herbs: ["茯苓", "白芍", "生姜", "白术", "附子"], tags: ["温阳利水"], notes: "原文芍药，目录用白芍；附子为炮附子。", references: [book("伤寒论·真武汤方", SHL, "茯苓、芍药、生姜、白术、炮附子")] },
  { name: "小青龙汤", pinyin: "XiaoQingLongTang", source: "伤寒论", indication: "外寒内饮", herbs: ["麻黄", "白芍", "细辛", "干姜", "甘草", "桂枝", "五味子", "半夏"], tags: ["解表", "化饮"], notes: "原文芍药，目录用白芍。", references: [book("伤寒论·小青龙汤方", SHL, "麻黄、芍药、细辛、干姜、甘草、桂枝、五味子、半夏")] },
  { name: "五苓散", pinyin: "WuLingSan", source: "伤寒论", indication: "膀胱气化不利、水湿内停", herbs: ["猪苓", "泽泻", "白术", "茯苓", "桂枝"], tags: ["利水"], notes: "维基文库句作“株茯苓”，与宋本“茯苓十八铢”对应，目录用茯苓。", references: [book("伤寒论·五苓散方", SHL, "猪苓、泽泻、白术、茯苓、桂枝")] },
  { name: "桃核承气汤", pinyin: "TaoHeChengQiTang", source: "伤寒论", indication: "下焦蓄血", herbs: ["桃仁", "大黄", "桂枝", "甘草", "芒硝"], tags: ["活血", "攻下"], references: [book("伤寒论·桃核承气汤方", SHL, "桃仁、大黄、桂枝、甘草、芒硝")] },
  { name: "炙甘草汤", pinyin: "ZhiGanCaoTang", source: "伤寒论", indication: "心动悸、脉结代", herbs: ["甘草", "生姜", "人参", "生地黄", "桂枝", "阿胶", "麦冬", "火麻仁", "大枣"], tags: ["益气", "复脉"], notes: "原文用清酒煎，麦门冬作麦冬，麻仁作火麻仁。", references: [book("伤寒论·炙甘草汤方", SHL, "甘草、生姜、人参、桂枝、生地黄、阿胶、麦门冬、麻仁、大枣")] },
  { name: "小建中汤", pinyin: "XiaoJianZhongTang", source: "伤寒论", indication: "中焦虚寒、虚劳腹痛", herbs: ["桂枝", "甘草", "大枣", "白芍", "生姜", "饴糖"], tags: ["温中", "补虚"], notes: "原文芍药、胶饴。", references: [book("伤寒论·小建中汤方", SHL, "桂枝、甘草、大枣、芍药、生姜、胶饴")] },
  { name: "金匮肾气丸", pinyin: "ShenQiWan", source: "金匮要略", indication: "肾阳不足", herbs: ["生地黄", "山药", "山茱萸", "泽泻", "茯苓", "牡丹皮", "桂枝", "附子"], tags: ["补肾", "温阳"], notes: "崔氏八味丸原文为干地黄、薯蓣。干地黄对应目录生地黄，薯蓣对应山药。后世桂附地黄丸常改熟地黄。", references: [book("金匮要略·崔氏八味丸", JG, "干地黄、山茱萸、薯蓣、泽泻、茯苓、牡丹皮、桂枝、炮附子")] },
  { name: "茵陈蒿汤", pinyin: "YinChenHaoTang", source: "伤寒论", indication: "湿热黄疸", herbs: ["茵陈", "栀子", "大黄"], tags: ["利湿", "退黄"], references: [book("伤寒论·茵陈蒿汤方", SHL, "茵陈蒿、栀子、大黄")] },
  { name: "桂枝茯苓丸", pinyin: "GuiZhiFuLingWan", source: "金匮要略", indication: "瘀阻胞宫", herbs: ["桂枝", "茯苓", "牡丹皮", "桃仁", "白芍"], tags: ["活血"], notes: "原文芍药，目录用白芍。", references: [book("金匮要略·桂枝茯苓丸方", JG, "桂枝、茯苓、牡丹、桃仁、芍药各等分")] },
  { name: "苓桂术甘汤", pinyin: "LingGuiZhuGanTang", source: "伤寒论", indication: "中阳不足、痰饮内停", herbs: ["茯苓", "桂枝", "白术", "甘草"], tags: ["温化痰饮"], notes: "原文名茯苓桂枝白术甘草汤。", references: [book("伤寒论·茯苓桂枝白术甘草汤方", SHL, "茯苓、桂枝、白术、甘草")] },
  { name: "甘麦大枣汤", pinyin: "GanMaiDaZaoTang", source: "金匮要略", indication: "脏躁", herbs: ["甘草", "小麦", "大枣"], tags: ["养心"], notes: "维基文库本记主治“妇人脏躁，喜悲伤欲哭”，未逐录药味。药味依通行本：甘草、小麦、大枣。", references: [book("金匮要略·妇人杂病", JG, "甘麦大枣汤主脏躁")] },
  { name: "半夏厚朴汤", pinyin: "BanXiaHouPoTang", source: "金匮要略", indication: "梅核气", herbs: ["半夏", "厚朴", "茯苓", "生姜", "紫苏叶"], tags: ["行气", "化痰"], notes: "维基文库本记“妇人咽中如有炙脔，半夏厚朴汤主之”，未逐录药味。药味依通行本，干苏叶作紫苏叶。", references: [book("金匮要略·妇人杂病", JG, "半夏厚朴汤主咽中如有炙脔")] },
  { name: "黄芪桂枝五物汤", pinyin: "HuangQiGuiZhiWuWuTang", source: "金匮要略", indication: "血痹", herbs: ["黄芪", "白芍", "桂枝", "生姜", "大枣"], tags: ["益气", "和营"], notes: "原文芍药，目录用白芍。", references: [book("金匮要略·黄芪桂枝五物汤方", JG, "黄芪、芍药、桂枝、生姜、大枣")] },
  { name: "玉屏风散", pinyin: "YuPingFengSan", source: "究原方", indication: "表虚自汗", herbs: ["黄芪", "白术", "防风"], tags: ["固表"], references: [book("究原方，丹溪心法收录", "", "黄芪、白术、防风")] },
  { name: "补阳还五汤", pinyin: "BuYangHuanWuTang", source: "医林改错", indication: "气虚血瘀中风", herbs: ["黄芪", "当归", "赤芍", "地龙", "川芎", "红花", "桃仁"], tags: ["补气", "活血"], notes: "原文当归尾，目录用当归。", references: [book("医林改错·补阳还五汤", "", "黄芪、当归尾、赤芍、地龙、川芎、红花、桃仁")] },
  { name: "桑菊饮", pinyin: "SangJuYin", source: "温病条辨", indication: "风温初起、咳嗽", herbs: ["桑叶", "菊花", "杏仁", "连翘", "薄荷", "桔梗", "甘草", "芦根"], tags: ["疏风", "宣肺"], references: [book("温病条辨·桑菊饮", "", "桑叶、菊花、杏仁、连翘、薄荷、桔梗、甘草、芦根")] },
  { name: "增液汤", pinyin: "ZengYeTang", source: "温病条辨", indication: "阳明温病、阴虚液涸", herbs: ["玄参", "麦冬", "生地黄"], tags: ["养阴"], references: [book("温病条辨·增液汤", "", "玄参、麦冬、细生地")] },
  { name: "参苓白术散", pinyin: "ShenLingBaiZhuSan", source: "太平惠民和剂局方", indication: "脾虚夹湿泄泻", herbs: ["人参", "白术", "茯苓", "甘草", "山药", "莲子", "白扁豆", "薏苡仁", "砂仁", "桔梗"], tags: ["健脾", "渗湿"], notes: "依局方药味，不另加后世有的陈皮。", references: [book("太平惠民和剂局方·参苓白术散", "", "人参、白术、茯苓、甘草、山药、莲子、白扁豆、薏苡仁、砂仁、桔梗")] },
  { name: "川芎茶调散", pinyin: "ChuanXiongChaTiaoSan", source: "太平惠民和剂局方", indication: "外感风邪头痛", herbs: ["川芎", "荆芥", "白芷", "羌活", "甘草", "细辛", "防风", "薄荷"], tags: ["头痛", "疏风"], notes: "用清茶调服。", references: [book("太平惠民和剂局方·川芎茶调散", "", "川芎、荆芥、白芷、羌活、甘草、细辛、防风、薄荷")] },
  { name: "生脉散", pinyin: "ShengMaiSan", source: "医学启源", indication: "气阴两虚", herbs: ["人参", "麦冬", "五味子"], tags: ["益气", "养阴"], references: [book("医学启源·生脉散", "", "人参、麦冬、五味子")] },
  { name: "六君子汤", pinyin: "LiuJunZiTang", source: "医学正传", indication: "脾胃气虚兼痰湿", herbs: ["人参", "白术", "茯苓", "甘草", "陈皮", "半夏"], tags: ["健脾", "化痰"], references: [book("医学正传·六君子汤", "", "四君子汤加陈皮、半夏")] },
  { name: "痛泻要方", pinyin: "TongXieYaoFang", source: "丹溪心法", indication: "脾虚肝旺泄泻", herbs: ["白术", "白芍", "陈皮", "防风"], tags: ["补脾", "柔肝"], references: [book("丹溪心法·痛泻要方", "", "白术、白芍、陈皮、防风")] },
  { name: "白头翁汤", pinyin: "BaiTouWengTang", source: "伤寒论", indication: "热毒血痢", herbs: ["白头翁", "黄柏", "黄连", "秦皮"], tags: ["凉血", "止痢"], notes: "原文“两檗”即黄柏。", references: [book("伤寒论·白头翁汤方", SHL, "白头翁、黄柏、黄连、秦皮")] },
  { name: "普济消毒饮", pinyin: "PuJiXiaoDuYin", source: "东垣试效方", indication: "大头瘟、风热疫毒", herbs: ["黄芩", "黄连", "陈皮", "甘草", "玄参", "柴胡", "桔梗", "连翘", "板蓝根", "马勃", "牛蒡子", "薄荷", "僵蚕", "升麻"], tags: ["清热解毒"], notes: "原方或有人参。此处用方剂学常用十四味，不含人参。", references: [book("东垣试效方·普济消毒饮", "", "黄芩、黄连、陈皮、甘草、玄参、柴胡、桔梗、连翘、板蓝根、马勃、牛蒡子、薄荷、僵蚕、升麻")] }
];

export const herbAnnotations = [
  { name: "半夏", caution: "有毒。一般炮制后入煎剂；不宜与乌头类同用。", references: [yd("半夏", "辛，温；有毒。归脾、胃、肺经。")] },
  { name: "杏仁", caution: "苦杏仁有小毒，用量需遵循药典。", references: [yd("苦杏仁", "苦，微温；有小毒。苦杏仁苷为含量测定指标。目录药材名沿用“杏仁”。")] },
  { name: "藿香", nameAliases: ["霍香"], notes: "HERB 没有简体“藿香”正名，异体字“霍香”的英文是 Wrinkled Gianthyssop，对应土藿香，不是广藿香。", references: [yd("广藿香", "药典广藿香为 Pogostemon cablin。本目录按方名保留藿香，并只接受 HERB 的异体字霍香。")] },
  { name: "竹叶", notes: "HERB 没有中文名恰好为“竹叶”的记录。拼音 ZHU YE 会命中猪靥，不能采用。银翘散中的竹叶现代常作淡竹叶，目录不自动替换。" }
];

export const herbSeeds = [
  { name: "黄芪", pinyin: "Huangqi", nature: "微温", flavors: ["甘"], meridians: ["肺", "脾"], effects: ["补气升阳", "固表止汗"], sources: ["HERB", "TCMSP", "SymMap"], references: [yd("黄芪", "甘，微温。归肺、脾经。")] },
  { name: "当归", pinyin: "Danggui", nature: "温", flavors: ["甘", "辛"], meridians: ["肝", "心", "脾"], effects: ["补血活血", "调经止痛"], sources: ["HERB", "TCMSP"], references: [yd("当归", "甘、辛，温。归肝、心、脾经。")] },
  { name: "柴胡", pinyin: "Chaihu", nature: "微寒", flavors: ["苦", "辛"], meridians: ["肝", "胆"], effects: ["疏散退热", "疏肝解郁"], sources: ["HERB", "SymMap"], references: [yd("柴胡", "苦、辛，微寒。归肝、胆经。")] },
  { name: "白术", pinyin: "Baizhu", nature: "温", flavors: ["苦", "甘"], meridians: ["脾", "胃"], effects: ["健脾益气", "燥湿利水"], sources: ["HERB", "TCMSP"], references: [yd("白术", "苦、甘，温。归脾、胃经。")] },
  { name: "茯苓", pinyin: "Fuling", nature: "平", flavors: ["甘", "淡"], meridians: ["心", "肺", "脾", "肾"], effects: ["利水渗湿", "健脾宁心"], sources: ["HERB", "TCMSP"], references: [yd("茯苓", "甘、淡，平。归心、肺、脾、肾经。")] },
  { name: "陈皮", pinyin: "Chenpi", nature: "温", flavors: ["苦", "辛"], meridians: ["肺", "脾"], effects: ["理气健脾", "燥湿化痰"], sources: ["HERB"], references: [yd("陈皮", "苦、辛，温。归肺、脾经。")] },
  { name: "半夏", pinyin: "Banxia", nature: "温", flavors: ["辛"], meridians: ["脾", "胃", "肺"], effects: ["燥湿化痰", "降逆止呕"], caution: "有毒。一般炮制后入煎剂；不宜与乌头类同用。", sources: ["HERB", "TCMSP"], references: [yd("半夏", "辛，温；有毒。")] },
  { name: "生地黄", pinyin: "Shengdihuang", nature: "寒", flavors: ["甘", "苦"], meridians: ["心", "肝", "肾"], effects: ["清热凉血", "养阴生津"], sources: ["HERB"], references: [yd("地黄", "鲜地黄/生地黄：甘、苦，寒。归心、肝、肾经。")] },
  { name: "熟地黄", pinyin: "Shudihuang", nature: "微温", flavors: ["甘"], meridians: ["肝", "肾"], effects: ["补血滋阴", "益精填髓"], sources: ["HERB"], references: [yd("熟地黄", "甘，微温。归肝、肾经。")] },
  { name: "山药", pinyin: "Shanyao", nature: "平", flavors: ["甘"], meridians: ["脾", "肺", "肾"], effects: ["补脾养胃", "生津益肺"], sources: ["HERB"], references: [yd("山药", "甘，平。归脾、肺、肾经。")] },
  { name: "山茱萸", pinyin: "Shanzhuyu", nature: "微温", flavors: ["酸", "涩"], meridians: ["肝", "肾"], effects: ["补益肝肾", "收涩固脱"], sources: ["HERB"], references: [yd("山茱萸", "酸、涩，微温。归肝、肾经。")] },
  { name: "泽泻", pinyin: "Zexie", nature: "寒", flavors: ["甘", "淡"], meridians: ["肾", "膀胱"], effects: ["利水渗湿", "泄热"], sources: ["HERB"], references: [yd("泽泻", "甘、淡，寒。归肾、膀胱经。")] },
  { name: "牡丹皮", pinyin: "Mudanpi", nature: "微寒", flavors: ["苦", "辛"], meridians: ["心", "肝", "肾"], effects: ["清热凉血", "活血化瘀"], sources: ["HERB"], references: [yd("牡丹皮", "苦、辛，微寒。归心、肝、肾经。")] },
  { name: "栀子", pinyin: "Zhizi", nature: "寒", flavors: ["苦"], meridians: ["心", "肺", "三焦"], effects: ["泻火除烦", "清热利湿"], sources: ["HERB", "TCMSP"], references: [yd("栀子", "苦，寒。归心、肺、三焦经。")] },
  { name: "石膏", pinyin: "Shigao", nature: "大寒", flavors: ["甘", "辛"], meridians: ["肺", "胃"], effects: ["清热泻火", "除烦止渴"], sources: ["HERB"], references: [yd("石膏", "甘、辛，大寒。归肺、胃经。")] },
  { name: "知母", pinyin: "Zhimu", nature: "寒", flavors: ["苦", "甘"], meridians: ["肺", "胃", "肾"], effects: ["清热泻火", "滋阴润燥"], sources: ["HERB"], references: [yd("知母", "苦、甘，寒。归肺、胃、肾经。")] },
  { name: "葛根", pinyin: "Gegen", nature: "凉", flavors: ["甘", "辛"], meridians: ["脾", "胃", "肺"], effects: ["解肌退热", "生津止渴"], sources: ["HERB"], references: [yd("葛根", "甘、辛，凉。归脾、胃、肺经。")] },
  { name: "大黄", pinyin: "Dahuang", nature: "寒", flavors: ["苦"], meridians: ["脾", "胃", "大肠", "肝", "心包"], effects: ["泻下攻积", "清热泻火"], sources: ["HERB", "SymMap"], references: [yd("大黄", "苦，寒。归脾、胃、大肠、肝、心包经。")] },
  { name: "厚朴", pinyin: "Houpo", nature: "温", flavors: ["苦", "辛"], meridians: ["脾", "胃", "肺", "大肠"], effects: ["燥湿消痰", "下气除满"], sources: ["HERB"], references: [yd("厚朴", "苦、辛，温。归脾、胃、肺、大肠经。")] },
  { name: "枳实", pinyin: "Zhishi", nature: "微寒", flavors: ["苦", "辛", "酸"], meridians: ["脾", "胃"], effects: ["破气消积", "化痰散痞"], sources: ["HERB"], references: [yd("枳实", "苦、辛、酸，微寒。归脾、胃经。")] },
  { name: "桃仁", pinyin: "Taoren", nature: "平", flavors: ["苦", "甘"], meridians: ["心", "肝", "大肠"], effects: ["活血祛瘀", "润肠通便"], sources: ["HERB"], references: [yd("桃仁", "苦、甘，平。归心、肝、大肠经。")] },
  { name: "红花", pinyin: "Honghua", nature: "温", flavors: ["辛"], meridians: ["心", "肝"], effects: ["活血通经", "散瘀止痛"], sources: ["HERB"], references: [yd("红花", "辛，温。归心、肝经。")] },
  { name: "川芎", pinyin: "Chuanxiong", nature: "温", flavors: ["辛"], meridians: ["肝", "胆", "心包"], effects: ["活血行气", "祛风止痛"], sources: ["HERB"], references: [yd("川芎", "辛，温。归肝、胆、心包经。")] },
  { name: "赤芍", pinyin: "Chishao", nature: "微寒", flavors: ["苦"], meridians: ["肝"], effects: ["清热凉血", "散瘀止痛"], sources: ["HERB"], references: [yd("赤芍", "苦，微寒。归肝经。")] },
  { name: "牛膝", pinyin: "Niuxi", nature: "平", flavors: ["苦", "酸"], meridians: ["肝", "肾"], effects: ["活血通经", "补肝肾"], sources: ["HERB"], references: [yd("牛膝", "苦、酸，平。归肝、肾经。")] },
  { name: "丹参", pinyin: "Danshen", nature: "微寒", flavors: ["苦"], meridians: ["心", "肝"], effects: ["活血祛瘀", "凉血消痈"], sources: ["HERB", "TCMSP"], references: [yd("丹参", "苦，微寒。归心、肝经。")] },
  { name: "麦冬", pinyin: "Maidong", nature: "微寒", flavors: ["甘", "微苦"], meridians: ["心", "肺", "胃"], effects: ["养阴生津", "润肺清心"], sources: ["HERB"], references: [yd("麦冬", "甘、微苦，微寒。归心、肺、胃经。")] },
  { name: "玄参", pinyin: "Xuanshen", nature: "微寒", flavors: ["甘", "苦", "咸"], meridians: ["肺", "胃", "肾"], effects: ["清热凉血", "滋阴解毒"], sources: ["HERB"], references: [yd("玄参", "甘、苦、咸，微寒。归肺、胃、肾经。")] },
  { name: "酸枣仁", pinyin: "Suanzaoren", nature: "平", flavors: ["甘", "酸"], meridians: ["心", "肝", "胆"], effects: ["养心补肝", "宁心安神"], sources: ["HERB"], references: [yd("酸枣仁", "甘、酸，平。归心、肝、胆经。")] },
  { name: "远志", pinyin: "Yuanzhi", nature: "温", flavors: ["苦", "辛"], meridians: ["心", "肾", "肺"], effects: ["安神益智", "祛痰开窍"], sources: ["HERB"], references: [yd("远志", "苦、辛，温。归心、肾、肺经。")] },
  { name: "木香", pinyin: "Muxiang", nature: "温", flavors: ["辛", "苦"], meridians: ["脾", "胃", "大肠", "胆"], effects: ["行气止痛", "健脾消食"], sources: ["HERB"], references: [yd("木香", "辛、苦，温。归脾、胃、大肠、胆经。")] },
  { name: "升麻", pinyin: "Shengma", nature: "微寒", flavors: ["辛", "甘"], meridians: ["肺", "脾", "胃", "大肠"], effects: ["发表透疹", "清热解毒"], sources: ["HERB"], references: [yd("升麻", "辛、甘，微寒。归肺、脾、胃、大肠经。")] },
  { name: "藿香", pinyin: "Huoxiang", nature: "微温", flavors: ["辛"], meridians: ["脾", "胃", "肺"], effects: ["化湿", "止呕", "解暑"], sources: ["HERB"], references: [yd("广藿香", "辛，微温。归脾、胃、肺经。")] },
  { name: "紫苏叶", pinyin: "Zisuye", nature: "温", flavors: ["辛"], meridians: ["肺", "脾"], effects: ["解表散寒", "行气和胃"], sources: ["HERB"], references: [yd("紫苏叶", "辛，温。归肺、脾经。")] },
  { name: "白芷", pinyin: "Baizhi", nature: "温", flavors: ["辛"], meridians: ["肺", "胃", "大肠"], effects: ["解表散寒", "祛风止痛"], sources: ["HERB"], references: [yd("白芷", "辛，温。归肺、胃、大肠经。")] },
  { name: "苍术", pinyin: "Cangzhu", nature: "温", flavors: ["辛", "苦"], meridians: ["脾", "胃", "肝"], effects: ["燥湿健脾", "祛风散寒"], sources: ["HERB"], references: [yd("苍术", "辛、苦，温。归脾、胃、肝经。")] },
  { name: "竹茹", pinyin: "Zhuru", nature: "微寒", flavors: ["甘"], meridians: ["肺", "胃", "心"], effects: ["清热化痰", "除烦止呕"], sources: ["HERB"], references: [yd("竹茹", "甘，微寒。归肺、胃、心经。")] },
  { name: "枳壳", pinyin: "Zhiqiao", nature: "微寒", flavors: ["苦", "辛", "酸"], meridians: ["脾", "胃"], effects: ["理气宽中", "行滞消胀"], sources: ["HERB"], references: [yd("枳壳", "苦、辛、酸，微寒。归脾、胃经。")] },
  { name: "乌梅", pinyin: "Wumei", nature: "平", flavors: ["酸", "涩"], meridians: ["肝", "脾", "肺", "大肠"], effects: ["敛肺涩肠", "生津安蛔"], sources: ["HERB"], references: [yd("乌梅", "酸、涩，平。归肝、脾、肺、大肠经。")] },
  { name: "大枣", pinyin: "Dazao", nature: "温", flavors: ["甘"], meridians: ["脾", "胃", "心"], effects: ["补中益气", "养血安神"], sources: ["HERB"], references: [yd("大枣", "甘，温。归脾、胃、心经。")] },
  { name: "附子", pinyin: "Fuzi", nature: "大热", flavors: ["辛", "甘"], meridians: ["心", "肾", "脾"], effects: ["回阳救逆", "补火助阳", "散寒止痛"], caution: "有毒。孕妇慎用；不宜与半夏、瓜蒌、贝母、白蔹、白及同用。先煎、久煎。", sources: ["HERB", "TCMSP"], references: [yd("附子", "辛、甘，大热；有毒。归心、肾、脾经。", "http://m.cnpharm.com/c/2020-12-25/769368.shtml")] },
  { name: "干姜", pinyin: "Ganjiang", nature: "热", flavors: ["辛"], meridians: ["脾", "胃", "肾", "心", "肺"], effects: ["温中散寒", "回阳通脉", "温肺化饮"], sources: ["HERB", "TCMSP"], references: [yd("干姜", "辛，热。归脾、胃、肾、心、肺经。")] },
  { name: "细辛", pinyin: "Xixin", nature: "温", flavors: ["辛"], meridians: ["心", "肺", "肾"], effects: ["解表散寒", "祛风止痛", "通窍", "温肺化饮"], caution: "有小毒。不宜与藜芦同用。", sources: ["HERB", "TCMSP"], references: [yd("细辛", "辛，温；有小毒。归心、肺、肾经。")] },
  { name: "五味子", pinyin: "Wuweizi", nameAliases: ["北五味子"], nature: "温", flavors: ["酸", "甘"], meridians: ["肺", "心", "肾"], effects: ["收敛固涩", "益气生津", "补肾宁心"], sources: ["HERB", "TCMSP"], notes: "药典五味子来源为五味子，习称北五味子。TCMSP 若无“五味子”正名，只接受“北五味子”，不接受南五味子。", references: [yd("五味子", "酸、甘，温。归肺、心、肾经。习称北五味子。")] },
  { name: "猪苓", pinyin: "Zhuling", nature: "平", flavors: ["甘", "淡"], meridians: ["肾", "膀胱"], effects: ["利水渗湿"], sources: ["HERB"], references: [yd("猪苓", "甘、淡，平。归肾、膀胱经。")] },
  { name: "阿胶", pinyin: "Ejiao", nature: "平", flavors: ["甘"], meridians: ["肺", "肝", "肾"], effects: ["补血滋阴", "润燥", "止血"], sources: ["HERB"], references: [yd("阿胶", "甘，平。归肺、肝、肾经。")] },
  { name: "火麻仁", pinyin: "Huomaren", nature: "平", flavors: ["甘"], meridians: ["脾", "胃", "大肠"], effects: ["润肠通便"], sources: ["HERB"], references: [yd("火麻仁", "甘，平。归脾、胃、大肠经。")] },
  { name: "饴糖", pinyin: "Yitang", nature: "温", flavors: ["甘"], meridians: ["脾", "胃", "肺"], effects: ["补中缓急", "润肺止咳"], sources: ["经典方书"], references: [{ source: "《中药学》通说", item: "饴糖", detail: "甘，温。归脾、胃、肺经。药典不单列饴糖专条。" }] },
  { name: "茵陈", pinyin: "Yinchen", nature: "微寒", flavors: ["苦", "辛"], meridians: ["脾", "胃", "肝", "胆"], effects: ["清利湿热", "利胆退黄"], sources: ["HERB"], references: [yd("茵陈", "苦、辛，微寒。归脾、胃、肝、胆经。")] },
  { name: "小麦", pinyin: "Xiaomai", nature: "凉", flavors: ["甘"], meridians: ["心", "脾"], effects: ["养心除烦"], sources: ["经典方书"], references: [{ source: "金匮要略甘麦大枣汤通行本", item: "小麦", detail: "甘，凉。养心除烦。与药典浮小麦专条不是同一味。" }] },
  { name: "桑叶", pinyin: "Sangye", nature: "寒", flavors: ["甘", "苦"], meridians: ["肺", "肝"], effects: ["疏散风热", "清肺润燥", "清肝明目"], sources: ["HERB"], references: [yd("桑叶", "甘、苦，寒。归肺、肝经。")] },
  { name: "菊花", pinyin: "Juhua", nature: "微寒", flavors: ["甘", "苦"], meridians: ["肺", "肝"], effects: ["散风清热", "平肝明目", "清热解毒"], sources: ["HERB"], references: [yd("菊花", "甘、苦，微寒。归肺、肝经。")] },
  { name: "防风", pinyin: "Fangfeng", nature: "微温", flavors: ["辛", "甘"], meridians: ["膀胱", "肝", "脾"], effects: ["祛风解表", "胜湿止痛", "止痉"], sources: ["HERB"], references: [yd("防风", "辛、甘，微温。归膀胱、肝、脾经。")] },
  { name: "地龙", pinyin: "Dilong", nature: "寒", flavors: ["咸"], meridians: ["肝", "脾", "膀胱"], effects: ["清热定惊", "通络", "平喘", "利尿"], sources: ["HERB"], references: [yd("地龙", "咸，寒。归肝、脾、膀胱经。")] },
  { name: "白扁豆", pinyin: "Baibiandou", nature: "微温", flavors: ["甘"], meridians: ["脾", "胃"], effects: ["健脾化湿", "和中消暑"], sources: ["HERB"], references: [yd("白扁豆", "甘，微温。归脾、胃经。")] },
  { name: "莲子", pinyin: "Lianzi", nature: "平", flavors: ["甘", "涩"], meridians: ["脾", "肾", "心"], effects: ["补脾止泻", "止带", "益肾涩精", "养心安神"], sources: ["HERB"], references: [yd("莲子", "甘、涩，平。归脾、肾、心经。")] },
  { name: "薏苡仁", pinyin: "Yiyiren", nature: "凉", flavors: ["甘", "淡"], meridians: ["脾", "胃", "肺"], effects: ["利水渗湿", "健脾止泻", "除痹", "排脓"], sources: ["HERB"], references: [yd("薏苡仁", "甘、淡，凉。归脾、胃、肺经。")] },
  { name: "砂仁", pinyin: "Sharen", nature: "温", flavors: ["辛"], meridians: ["脾", "胃", "肾"], effects: ["化湿开胃", "温脾止泻", "理气安胎"], sources: ["HERB"], references: [yd("砂仁", "辛，温。归脾、胃、肾经。")] },
  { name: "羌活", pinyin: "Qianghuo", nature: "温", flavors: ["辛", "苦"], meridians: ["膀胱", "肾"], effects: ["解表散寒", "祛风除湿", "止痛"], sources: ["HERB"], references: [yd("羌活", "辛、苦，温。归膀胱、肾经。")] },
  { name: "黄柏", pinyin: "Huangbo", nature: "寒", flavors: ["苦"], meridians: ["肾", "膀胱"], effects: ["清热燥湿", "泻火除蒸", "解毒疗疮"], sources: ["HERB", "TCMSP"], references: [yd("黄柏", "苦，寒。归肾、膀胱经。")] },
  { name: "秦皮", pinyin: "Qinpi", nature: "寒", flavors: ["苦", "涩"], meridians: ["肝", "胆", "大肠"], effects: ["清热燥湿", "收涩止痢", "止带", "明目"], sources: ["HERB"], references: [yd("秦皮", "苦、涩，寒。归肝、胆、大肠经。")] },
  { name: "白头翁", pinyin: "Baitouweng", nature: "寒", flavors: ["苦"], meridians: ["胃", "大肠"], effects: ["清热解毒", "凉血止痢"], sources: ["HERB"], references: [yd("白头翁", "苦，寒。归胃、大肠经。")] },
  { name: "板蓝根", pinyin: "Banlangen", nature: "寒", flavors: ["苦"], meridians: ["心", "胃"], effects: ["清热解毒", "凉血利咽"], sources: ["HERB"], references: [yd("板蓝根", "苦，寒。归心、胃经。")] },
  { name: "马勃", pinyin: "Mabo", nature: "平", flavors: ["辛"], meridians: ["肺"], effects: ["清肺利咽", "止血"], sources: ["HERB"], references: [yd("马勃", "辛，平。归肺经。")] },
  { name: "僵蚕", pinyin: "Jiangcan", nature: "平", flavors: ["咸", "辛"], meridians: ["肝", "肺", "胃"], effects: ["息风止痉", "祛风止痛", "化痰散结"], sources: ["HERB"], references: [yd("僵蚕", "咸、辛，平。归肝、肺、胃经。")] },
  { name: "粳米", pinyin: "Jingmi", nature: "平", flavors: ["甘"], meridians: ["脾", "胃"], effects: ["补中益气", "健脾和胃"], sources: ["经典方书"], references: [{ source: "伤寒论白虎汤及《中药学》通说", item: "粳米", detail: "甘，平。归脾、胃经。补中益气，健脾和胃。" }] },
  { name: "龙胆草", pinyin: "Longdancao", nature: "寒", flavors: ["苦"], meridians: ["肝", "胆"], effects: ["清热燥湿", "泻肝胆火"], sources: ["HERB"], notes: "药典专条名为龙胆。", references: [yd("龙胆", "苦，寒。归肝、胆经。")] },
  { name: "木通", pinyin: "Mutong", nature: "寒", flavors: ["苦"], meridians: ["心", "小肠", "膀胱"], effects: ["利尿通淋", "清心火", "通经下乳"], caution: "此处为药典木通科木通。不要换成马兜铃科关木通。", sources: ["HERB"], references: [yd("木通", "苦，寒。归心、小肠、膀胱经。来源为木通科木通等，不是关木通。")] },
  { name: "车前子", pinyin: "Cheqianzi", nature: "寒", flavors: ["甘"], meridians: ["肾", "肝", "肺", "小肠"], effects: ["清热利尿通淋", "渗湿止泻", "明目", "祛痰"], sources: ["HERB"], references: [yd("车前子", "甘，寒。归肾、肝、肺、小肠经。")] },
  { name: "大腹皮", pinyin: "Dafupi", nature: "微温", flavors: ["辛"], meridians: ["脾", "胃", "大肠", "小肠"], effects: ["行气宽中", "行水消肿"], sources: ["HERB"], references: [yd("大腹皮", "辛，微温。归脾、胃、大肠、小肠经。")] },
  { name: "橘红", pinyin: "Juhong", nature: "温", flavors: ["辛", "苦"], meridians: ["肺", "脾"], effects: ["理气宽中", "燥湿化痰"], sources: ["HERB"], references: [yd("橘红", "辛、苦，温。归肺、脾经。")] },
  { name: "茯神", pinyin: "Fushen", nature: "平", flavors: ["甘", "淡"], meridians: ["心", "脾"], effects: ["宁心安神"], sources: ["经典方书"], notes: "传统为茯苓菌核抱松根的部分。药典多在茯苓项下，不单列同等专条。", references: [{ source: "《中药学》通说", item: "茯神", detail: "甘、淡，平。归心、脾经。宁心安神。" }] },
  { name: "龙眼肉", pinyin: "Longyanrou", nature: "温", flavors: ["甘"], meridians: ["心", "脾"], effects: ["补益心脾", "养血安神"], sources: ["HERB"], references: [yd("龙眼肉", "甘，温。归心、脾经。")] },
  { name: "芒硝", pinyin: "Mangxiao", nature: "寒", flavors: ["咸", "苦"], meridians: ["胃", "大肠"], effects: ["泻下通便", "润燥软坚", "清火消肿"], caution: "孕妇慎用。", sources: ["HERB"], references: [yd("芒硝", "咸、苦，寒。归胃、大肠经。孕妇慎用。")] },
  { name: "水牛角", pinyin: "Shuiniujiao", nature: "寒", flavors: ["苦"], meridians: ["心", "肝"], effects: ["清热凉血", "解毒", "定惊"], sources: ["HERB"], notes: "清营汤等历史方中的犀角，现行用药以水牛角代替。目录不收录犀角。", references: [yd("水牛角", "苦，寒。归心、肝经。清热凉血，解毒，定惊。")] }
];

const curatedScoreNote = "分数 70 只表示这条已引用的关联可以出现在默认置信度筛选中，不是结合亲和力、也不是 TCMSP 网络分。";

export const compoundSeeds = [
  { name: "Icariin", cn: "淫羊藿苷", ob: 41.6, dl: 0.61, targets: {} },
  { name: "Tanshinone IIA", cn: "丹参酮 IIA", ob: 49.9, dl: 0.40, targets: {}, acceptedSynonyms: ["Tanshinone IIa"] },
  { name: "Emodin", cn: "大黄素", ob: 24.4, dl: 0.24, targets: {} },
  { name: "Puerarin", cn: "葛根素", ob: 24.0, dl: 0.69, targets: {} },
  { name: "Astragaloside IV", cn: "黄芪甲苷", ob: 22.5, dl: 0.15, targets: {} },
  { name: "Curcumin", cn: "姜黄素", ob: 33.0, dl: 0.18, targets: {} },
  { name: "Gallic acid", cn: "没食子酸", ob: 31.7, dl: 0.04, targets: {} },
  { name: "Beta-sitosterol", cn: "β-谷甾醇", ob: 36.9, dl: 0.75, targets: {} },
  { name: "Stigmasterol", cn: "豆甾醇", ob: 43.8, dl: 0.76, targets: {} },
  { name: "Naringenin", cn: "柚皮素", ob: 59.3, dl: 0.21, targets: {} },
  { name: "Rutin", cn: "芦丁", ob: 3.2, dl: 0.68, targets: {}, acceptedSynonyms: ["Quercetin 3-O-beta-D-rutinoside"] },
  { name: "Wogonin", cn: "汉黄芩素", ob: 30.7, dl: 0.23, targets: {}, acceptedSynonyms: ["Norwogonin 8-methyl ether"] },
  { name: "Oroxylin A", cn: "千层纸素 A", ob: 41.4, dl: 0.23, targets: {} },
  { name: "Formononetin", cn: "芒柄花素", ob: 69.7, dl: 0.21, targets: {} },
  { name: "Calycosin", cn: "毛蕊异黄酮", ob: 47.8, dl: 0.24, targets: {} },
  { name: "Daidzein", cn: "大豆苷元", ob: 23.1, dl: 0.06, targets: {} },
  { name: "Genistein", cn: "染料木素", ob: 17.9, dl: 0.21, targets: {} },
  { name: "Amygdalin", cn: "苦杏仁苷", ob: 21.1, dl: 0.62, targets: {} },
  { name: "Honokiol", cn: "和厚朴酚", ob: 30.7, dl: 0.38, targets: {} },
  { name: "Magnolol", cn: "厚朴酚", ob: 61.0, dl: 0.19, targets: {} },
  { name: "Berberine", cn: "小檗碱", targets: {}, targetLinks: [
    { symbol: "PRKAA1", score: 70, doi: "10.2337/db06-0006", note: `Lee YS 等，Diabetes，2006。小檗碱激活 AMPK。${curatedScoreNote}` },
    { symbol: "LDLR", score: 70, doi: "10.1038/nm1135", note: `Kong W 等，Nat Med，2004。小檗碱上调 LDLR。${curatedScoreNote}` }
  ], references: [
    { title: "Lee YS et al. Berberine, a natural plant product, activates AMP-activated protein kinase with beneficial metabolic effects in diabetic and insulin-resistant states. Diabetes. 2006.", doi: "10.2337/db06-0006", url: "https://doi.org/10.2337/db06-0006" },
    { title: "Kong W et al. Berberine is a novel cholesterol-lowering drug working through a unique mechanism distinct from statins. Nat Med. 2004.", doi: "10.1038/nm1135", url: "https://doi.org/10.1038/nm1135" }
  ] },
  { name: "Ephedrine", cn: "麻黄碱", targets: {}, targetLinks: [
    { symbol: "ADRB2", score: 70, url: "https://go.drugbank.com/drugs/DB01364", note: `DrugBank DB01364 将麻黄碱与 β2 肾上腺素受体关联。${curatedScoreNote}` }
  ], references: [{ title: "DrugBank: Ephedrine", url: "https://go.drugbank.com/drugs/DB01364", id: "DB01364" }] },
  { name: "Glycyrrhizic acid", cn: "甘草酸", targets: {}, acceptedSynonyms: ["18-beta-Glycyrrhizic acid"] },
  { name: "Ferulic acid", cn: "阿魏酸", targets: {}, acceptedSynonyms: ["CINNAMIC ACID,4-HYDROXY,3-METHOXY   FERULIC ACID"] },
  { name: "Aconitine", cn: "乌头碱", ob: null, dl: null, targets: {}, references: [yd("附子", "双酯型生物碱检查包含乌头碱。此成分是毒性指标，不是推荐剂量。")] },
  { name: "Schisandrin", cn: "五味子醇甲", ob: null, dl: null, targets: {}, acceptedSynonyms: ["Schizandrin"], references: [yd("五味子", "含量测定指标含五味子醇甲。")] },
  { name: "Geniposide", cn: "栀子苷", ob: null, dl: null, targets: {}, references: [yd("栀子", "含量测定指标含栀子苷。")] },
  { name: "Phillyrin", cn: "连翘苷", ob: null, dl: null, targets: {}, references: [yd("连翘", "含量测定指标含连翘苷。")] },
  { name: "Saikosaponin A", cn: "柴胡皂苷 a", ob: null, dl: null, targets: {}, references: [yd("柴胡", "柴胡皂苷是柴胡的代表性皂苷。")] },
  { name: "Paeonol", cn: "丹皮酚", ob: null, dl: null, targets: {}, references: [yd("牡丹皮", "含量测定指标含丹皮酚。")] },
  { name: "Loganin", cn: "马钱苷", ob: null, dl: null, targets: {}, references: [yd("山茱萸", "含量测定指标含马钱苷。")] },
  { name: "Catalpol", cn: "梓醇", ob: null, dl: null, targets: {}, references: [yd("地黄", "地黄的代表性环烯醚萜为梓醇。")] },
  { name: "Hesperidin", cn: "橙皮苷", ob: null, dl: null, targets: {}, references: [yd("陈皮", "含量测定指标含橙皮苷。")] },
  { name: "Palmatine", cn: "巴马汀", ob: null, dl: null, targets: {}, references: [yd("黄连", "黄连生物碱含小檗碱、巴马汀等。")] },
  { name: "Liquiritin", cn: "甘草苷", ob: null, dl: null, targets: {}, references: [yd("甘草", "含量测定指标含甘草苷。")] },
  { name: "Ginsenoside Rb1", cn: "人参皂苷 Rb1", ob: null, dl: null, targets: {}, references: [yd("人参", "含量测定指标含人参皂苷 Rb1。")] },
  { name: "Baicalein", cn: "黄芩素", ob: null, dl: null, targets: {}, references: [yd("黄芩", "黄芩黄酮含黄芩苷、黄芩素。")] },
  { name: "Imperatorin", cn: "欧前胡素", ob: null, dl: null, targets: {}, references: [yd("白芷", "含量测定指标含欧前胡素。")] },
  { name: "Synephrine", cn: "辛弗林", ob: null, dl: null, targets: {}, references: [yd("枳实", "含量测定指标含辛弗林。")] }
];

export const markerLinks = [
  { herb: "黄连", compounds: ["Berberine", "Palmatine"] },
  { herb: "黄芩", compounds: ["Baicalin", "Wogonin", "Baicalein"] },
  { herb: "甘草", compounds: ["Glycyrrhizic acid", "Liquiritin"] },
  { herb: "金银花", compounds: ["Chlorogenic acid"] },
  { herb: "连翘", compounds: ["Phillyrin"] },
  { herb: "丹参", compounds: ["Tanshinone IIA"] },
  { herb: "葛根", compounds: ["Puerarin"] },
  { herb: "大黄", compounds: ["Emodin"] },
  { herb: "黄芪", compounds: ["Astragaloside IV", "Calycosin", "Formononetin"] },
  { herb: "人参", compounds: ["Ginsenoside Rg1", "Ginsenoside Rb1"] },
  { herb: "麻黄", compounds: ["Ephedrine"] },
  { herb: "桂枝", compounds: ["Cinnamaldehyde"] },
  { herb: "白芍", compounds: ["Paeoniflorin"] },
  { herb: "当归", compounds: ["Ferulic acid"] },
  { herb: "杏仁", compounds: ["Amygdalin"] },
  { herb: "厚朴", compounds: ["Honokiol", "Magnolol"] },
  { herb: "陈皮", compounds: ["Hesperidin"] },
  { herb: "柴胡", compounds: ["Saikosaponin A"] },
  { herb: "五味子", compounds: ["Schisandrin"] },
  { herb: "附子", compounds: ["Aconitine"] },
  { herb: "栀子", compounds: ["Geniposide"] },
  { herb: "牡丹皮", compounds: ["Paeonol"] },
  { herb: "山茱萸", compounds: ["Loganin"] },
  { herb: "生地黄", compounds: ["Catalpol"] },
  { herb: "白芷", compounds: ["Imperatorin"] },
  { herb: "枳实", compounds: ["Synephrine"] }
];

export const pathwaySeeds = [
  { id: "p2", kegg: "hsa04668", url: "https://www.kegg.jp/pathway/hsa04668" },
  { id: "p5", kegg: "hsa04210", url: "https://www.kegg.jp/pathway/hsa04210" },
  { id: "p7", name: "NF-kappa B signaling pathway", cn: "NF-κB 信号通路", kegg: "hsa04064", score: null, url: "https://www.kegg.jp/pathway/hsa04064" },
  { id: "p8", name: "MAPK signaling pathway", cn: "MAPK 信号通路", kegg: "hsa04010", score: null, url: "https://www.kegg.jp/pathway/hsa04010" },
  { id: "p9", name: "Toll-like receptor signaling pathway", cn: "Toll 样受体信号通路", kegg: "hsa04620", score: null, url: "https://www.kegg.jp/pathway/hsa04620" },
  { id: "p10", name: "AMPK signaling pathway", cn: "AMPK 信号通路", kegg: "hsa04152", score: null, url: "https://www.kegg.jp/pathway/hsa04152" },
  { id: "p11", name: "Adrenergic signaling in cardiomyocytes", cn: "心肌细胞肾上腺素能信号", kegg: "hsa04261", score: null, url: "https://www.kegg.jp/pathway/hsa04261" },
  { id: "p12", name: "Cholesterol metabolism", cn: "胆固醇代谢", kegg: "hsa04979", score: null, url: "https://www.kegg.jp/pathway/hsa04979" },
  { id: "p13", name: "Cell adhesion molecule (CAM) interaction", cn: "细胞黏附分子相互作用", kegg: "hsa04514", score: null, url: "https://www.kegg.jp/pathway/hsa04514" }
];

export const diseaseSeeds = [
  { id: "d6", name: "Diabetes Mellitus, Type 2", cn: "2型糖尿病", references: [{ title: "MeSH Diabetes Mellitus, Type 2", id: "D003924", url: "https://meshb.nlm.nih.gov/record/ui?ui=D003924" }] },
  { id: "d7", name: "Coronary Artery Disease", cn: "冠状动脉疾病", references: [{ title: "MeSH Coronary Artery Disease", id: "D003324", url: "https://meshb.nlm.nih.gov/record/ui?ui=D003324" }] }
];

export const targetSeeds = [
  { symbol: "TP53", name: "Tumor protein p53", aliases: ["Cellular tumor antigen p53"], pathways: ["p5"], diseases: ["d3"] },
  { symbol: "EGFR", name: "Epidermal growth factor receptor", aliases: ["Epidermal growth factor receptor"], pathways: ["p4"], diseases: ["d3"] },
  { symbol: "VEGFA", name: "Vascular endothelial growth factor A", aliases: ["Vascular endothelial growth factor A"], pathways: ["p4"], diseases: ["d3"] },
  { symbol: "MMP9", name: "Matrix metallopeptidase 9", pathways: ["p1"], diseases: ["d2", "d3"] },
  { symbol: "PPARG", name: "Peroxisome proliferator activated receptor gamma", aliases: ["Peroxisome proliferator-activated receptor gamma"], pathways: ["p4"], diseases: ["d5"] },
  { symbol: "ESR1", name: "Estrogen receptor 1", pathways: ["p4"], diseases: ["d3"] },
  { symbol: "RELA", name: "RELA proto-oncogene, NF-kB subunit", pathways: ["p2"], diseases: ["d2"] },
  { symbol: "JUN", name: "Jun proto-oncogene", pathways: ["p1"], diseases: ["d2", "d3"] },
  { symbol: "FOS", name: "Fos proto-oncogene", aliases: ["Proto-oncogene c-Fos"], pathways: ["p1"], diseases: ["d2"] },
  { symbol: "CCND1", name: "Cyclin D1", aliases: ["G1/S-specific cyclin-D1"], pathways: ["p5"], diseases: ["d3"] },
  { symbol: "BCL2", name: "BCL2 apoptosis regulator", aliases: ["Apoptosis regulator Bcl-2"], pathways: ["p5"], diseases: ["d3"] },
  { symbol: "CASP8", name: "Caspase 8", aliases: ["Caspase-8"], pathways: ["p5"], diseases: ["d3"] },
  { symbol: "CXCL8", name: "C-X-C motif chemokine ligand 8", aliases: ["Interleukin-8"], pathways: ["p1"], diseases: ["d2"] },
  { symbol: "IL1B", name: "Interleukin 1 beta", aliases: ["Interleukin-1 beta"], pathways: ["p1"], diseases: ["d2"] },
  { symbol: "IFNG", name: "Interferon gamma", aliases: ["Interferon gamma"], pathways: ["p3"], diseases: ["d1", "d2"] },
  { symbol: "TNF", aliases: ["Tumor necrosis factor"] },
  { symbol: "NFKB1", aliases: ["Nuclear factor NF-kappa-B p105 subunit"] },
  { symbol: "IL6", aliases: ["Interleukin-6"] },
  { symbol: "PTGS2", aliases: ["Prostaglandin G/H synthase 2"] },
  { symbol: "AKT1", aliases: ["RAC-alpha serine/threonine-protein kinase"] },
  { symbol: "MAPK1", aliases: ["Mitogen-activated protein kinase 1"] },
  { symbol: "CASP3", aliases: ["Caspase-3"] },
  { symbol: "JAK2", aliases: ["Tyrosine-protein kinase JAK2"] },
  {
    symbol: "PRKAA1",
    name: "5'-AMP-activated protein kinase catalytic subunit alpha-1",
    aliases: ["5'-AMP-activated protein kinase catalytic subunit alpha-1"],
    pathways: ["p10"],
    diseases: ["d6"],
    references: [{ title: "KEGG PRKAA1", url: "https://www.kegg.jp/entry/hsa:5562" }, { title: "KEGG AMPK signaling pathway", url: "https://www.kegg.jp/pathway/hsa04152" }]
  },
  {
    symbol: "ADRB2",
    name: "Beta-2 adrenergic receptor",
    aliases: ["Beta-2 adrenergic receptor"],
    pathways: ["p11"],
    diseases: ["d4"],
    references: [{ title: "KEGG Adrenergic signaling in cardiomyocytes", url: "https://www.kegg.jp/pathway/hsa04261" }, { title: "DrugBank Ephedrine", url: "https://go.drugbank.com/drugs/DB01364" }]
  },
  {
    symbol: "TLR4",
    name: "Toll-like receptor 4",
    aliases: ["Toll-like receptor 4"],
    pathways: ["p9", "p7"],
    diseases: ["d2"],
    references: [{ title: "KEGG Toll-like receptor signaling pathway", url: "https://www.kegg.jp/pathway/hsa04620" }]
  },
  {
    symbol: "MAPK14",
    name: "Mitogen-activated protein kinase 14",
    aliases: ["Mitogen-activated protein kinase 14"],
    pathways: ["p8", "p9"],
    diseases: ["d2"],
    references: [{ title: "KEGG MAPK signaling pathway", url: "https://www.kegg.jp/pathway/hsa04010" }]
  },
  {
    symbol: "BAX",
    name: "Apoptosis regulator BAX",
    aliases: ["Apoptosis regulator BAX"],
    pathways: ["p5"],
    diseases: [],
    references: [{ title: "KEGG Apoptosis", url: "https://www.kegg.jp/pathway/hsa04210" }]
  },
  {
    symbol: "LDLR",
    name: "Low-density lipoprotein receptor",
    aliases: ["Low-density lipoprotein receptor"],
    pathways: ["p12"],
    diseases: ["d7"],
    references: [{ title: "KEGG Cholesterol metabolism", url: "https://www.kegg.jp/pathway/hsa04979" }, { title: "Kong et al. 2004", doi: "10.1038/nm1135", url: "https://doi.org/10.1038/nm1135" }]
  },
  {
    symbol: "ICAM1",
    name: "Intercellular adhesion molecule 1",
    aliases: ["Intercellular adhesion molecule 1"],
    pathways: ["p13", "p7"],
    diseases: ["d2"],
    references: [{ title: "KEGG Cell adhesion molecule interaction", url: "https://www.kegg.jp/pathway/hsa04514" }]
  },
  {
    symbol: "NFE2L2",
    name: "Nuclear factor erythroid 2-related factor 2",
    aliases: ["Nuclear factor erythroid 2-related factor 2"],
    pathways: [],
    diseases: [],
    references: [{ title: "UniProt NFE2L2", url: "https://www.uniprot.org/uniprotkb/Q16236/entry", id: "Q16236" }]
  }
];
