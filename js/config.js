// 游戏全局配置与文案字典
const Config = {
    // ---- 核心参数 ----
    blockHeight: 40,       // 方块高度
    initialWidth: 200,     // 初始方块宽度
    slideSpeed: 1,         // 方块横向移动速度（每帧像素）
    cameraOffsetY: 0.6,    // 相机高度比例（0.6表示当前堆叠平面位于屏幕从上往下60%处）

    // ---- 机制与分数参数 ----
    trapezoidStartIndex: 10, // 第10层后解锁梯形块
    trapezoidSpawnRate: 0.1, // 梯形块出现的概率
    minTextWidth: 40,        // 当方块宽度小于此值时隐藏文字
    comboRequirement: 5,     // 依然作为触发文案特效的条件
    perfectTolerance: 10,    // 完美对齐的像素容错率，进入该区间直接吸附不削减
    comboWidthBonus: 10,     // 触发Combo特效时给予的宽度补偿
    maxSkips: 3,             // 允许连续跳过的次数
    blockCornerRadius: 5,    // 【新增】方块圆角大小
    
    // 分数体系
    scoreBase: 10,           // 每落下一层的基准分
    scorePerfect: 10,        // 完美对齐额外加分
    scoreComboMultiplier: 5, // 连续完美对齐的Combo数 * 此参数 = Combo加分
    scoreWordBonus: 20,      // 成功收集一个词汇的额外加分

    // ---- 视觉与颜色参数 ----
    colors: {
        background: '#fdfbf7', 
        baseBlock: '#8B4513',       // 底部基石颜色
        normalBlock: '#c25953',     // Bricky Red (红砖色)
        normalBorder: '#8e3a35',    // 深红褐色边框
        trapezoidBlock: '#b0c4de',  // Pale Blue-Grey (淡蓝灰色)
        trapezoidBorder: '#778899', // 蓝灰边框
        specialBlock: '#f5f5dc',    // Pale Beige (浅米色/乳白色)
        specialBorder: '#ffffff',   // 白色发光边框
        text: '#333333'
    },
    bgImage: 'resources/images/background.png',

    // ---- 文案词典 ----
    text: {
        welcome: "准备好建造属于你的高塔了吗？\n点击任意位置下落方块，\n尝试完美对齐以获得高分！",
        warningPassive: "防消极游戏提示：\n您已连续跳过3个方块，\n请认真游戏哦！",
        warningWidth: "方块太窄，文字已隐藏",
        comboTexts: ["完美!", "超神!", "绝佳!", "天衣无缝!", "字字珠玑!"],
        gameName: "《字筑高塔》"
    },

    // ---- 背景实体已移除，由静态图片接管 ----

    // ---- 收集词库 (内置无重复词汇数组) ----
    wordPool: [
        "梦想", "坚持", "财富", "快乐", "健康", "自由", "勇气", "爱情", "智慧", "希望",
        "奋斗", "成功", "灵感", "和平", "冒险", "探索", "创新", "成长", "感恩", "包容",
        "自信", "独立", "温柔", "坚定", "无畏", "卓越", "真诚", "浪漫", "热情", "宁静",
        "奇迹", "辉煌", "荣耀", "纯粹", "信仰", "力量", "觉醒", "超越", "涅槃", "飞跃"
    ]
};
