// 游戏全局配置与文案字典
const Config = {
    // ---- 核心参数 ----
    blockHeight: 40,       // 方块高度
    initialWidth: 200,     // 初始方块宽度
    slideSpeed: 4,         // 方块横向移动速度（每帧像素）
    cameraOffsetY: 0.6,    // 相机高度比例（0.6表示当前堆叠平面位于屏幕从上往下60%处）

    // ---- 机制与分数参数 ----
    trapezoidStartIndex: 10, // 第10层后解锁梯形块
    trapezoidSpawnRate: 0.1, // 梯形块出现的概率
    minTextWidth: 40,        // 当方块宽度小于此值时隐藏文字
    comboRequirement: 5,     // 依然作为触发文案特效的条件
    perfectTolerance: 10,    // 【增大容错率】完美对齐的像素容错率，进入该区间直接吸附不削减
    comboWidthBonus: 10,     // 触发Combo特效时给予的宽度补偿
    maxSkips: 3,             // 允许连续跳过的次数
    blockCornerRadius: 5,    // 【新增】方块圆角大小
    
    // 分数体系
    scoreBase: 10,           // 每落下一层的基准分
    scorePerfect: 10,        // 完美对齐额外加分
    scoreComboMultiplier: 5, // 连续完美对齐的Combo数 * 此参数 = Combo加分
    scoreWordBonus: 20,      // 成功收集一个词汇的额外加分

    // ---- 背景高度阶段划分 (以向上偏移的像素为单位) ----
    // 方块高度默认 40，每层上升 40 像素。
    bgAltitudes: {
        city: 800,        // 20层左右开始进入城市
        mountain: 1800,   // 45层左右进入山脉
        cloud: 3000,      // 75层左右进入云层
        galaxy: 4800      // 120层左右进入星系
    },

    // ---- 视觉与颜色参数 ----
    colors: {
        background: '#fdfbf7', // 柔和的米白/马卡龙背景色
        baseBlock: '#d4c1d9',  // 底部基石颜色(柔和紫)
        // 方块颜色会根据层数做渐变
        hueSpeed: 5,           // 每层色相改变速度
        saturation: '65%',     // 柔和的饱和度
        lightness: '80%',      // 高亮度呈现马卡龙感
        text: '#555555',       // 因为方块变浅，文字改为深灰色以保证对比度
        specialBorder: '#ffb3ba' // 特殊块描边颜色(马卡龙粉)
    },

    // ---- 文案词典 ----
    text: {
        welcome: "准备好建造属于你的高塔了吗？\n点击任意位置下落方块，\n尝试完美对齐以获得高分！",
        warningPassive: "防消极游戏提示：\n您已连续跳过3个方块，\n请认真游戏哦！",
        warningWidth: "方块太窄，文字已隐藏",
        comboTexts: ["完美!", "超神!", "绝佳!", "天衣无缝!", "字字珠玑!"],
        gameName: "《字筑高塔》"
    },

    // ---- 背景实体 SVG (Data URI) ----
    bgEntities: {
        grass: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect x='135' y='200' width='30' height='80' rx='5' fill='%238D6E63'/><circle cx='150' cy='140' r='70' fill='%23A5D6A7'/><circle cx='100' cy='160' r='50' fill='%2381C784'/><circle cx='200' cy='160' r='50' fill='%2381C784'/><circle cx='150' cy='100' r='60' fill='%2366BB6A'/></svg>",
        city: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect x='40' y='100' width='80' height='200' rx='4' fill='%239FA8DA'/><rect x='60' y='120' width='15' height='20' fill='%23E8EAF6'/><rect x='85' y='120' width='15' height='20' fill='%23E8EAF6'/><rect x='60' y='160' width='15' height='20' fill='%23E8EAF6'/><rect x='85' y='160' width='15' height='20' fill='%23E8EAF6'/><rect x='140' y='50' width='100' height='250' rx='4' fill='%237986CB'/><rect x='160' y='80' width='20' height='25' fill='%23C5CAE9'/><rect x='200' y='80' width='20' height='25' fill='%23C5CAE9'/><rect x='160' y='130' width='20' height='25' fill='%23C5CAE9'/><rect x='200' y='130' width='20' height='25' fill='%23C5CAE9'/><rect x='160' y='180' width='20' height='25' fill='%23C5CAE9'/><rect x='200' y='180' width='20' height='25' fill='%23C5CAE9'/></svg>",
        mountain: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><path d='M 200 50 L 50 300 L 350 300 Z' fill='%23B39DDB'/><path d='M 200 50 L 140 150 L 170 170 L 200 130 L 230 160 L 260 150 Z' fill='%23EDE7F6'/><path d='M 120 120 L 20 280 L 220 280 Z' fill='%239575CD'/><path d='M 120 120 L 80 180 L 100 190 L 120 170 L 140 180 L 160 180 Z' fill='%23F3E5F5'/></svg>",
        galaxy: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><circle cx='150' cy='150' r='60' fill='%23FFB74D'/><ellipse cx='150' cy='150' rx='100' ry='25' fill='none' stroke='%23FFE0B2' stroke-width='8' transform='rotate(-15 150 150)'/><circle cx='130' cy='130' r='15' fill='%23FFA726'/><circle cx='170' cy='160' r='10' fill='%23FFA726'/><circle cx='50' cy='50' r='3' fill='%23FFF'/><circle cx='250' cy='80' r='4' fill='%23FFF'/><circle cx='80' cy='250' r='2' fill='%23FFF'/><circle cx='260' cy='220' r='5' fill='%23FFF'/></svg>"
    },

    // ---- 收集词库 (内置无重复词汇数组) ----
    wordPool: [
        "梦想", "坚持", "财富", "快乐", "健康", "自由", "勇气", "爱情", "智慧", "希望",
        "奋斗", "成功", "灵感", "和平", "冒险", "探索", "创新", "成长", "感恩", "包容",
        "自信", "独立", "温柔", "坚定", "无畏", "卓越", "真诚", "浪漫", "热情", "宁静",
        "奇迹", "辉煌", "荣耀", "纯粹", "信仰", "力量", "觉醒", "超越", "涅槃", "飞跃"
    ]
};
