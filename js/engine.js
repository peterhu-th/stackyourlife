class GameEngine {
    constructor(canvas, uiManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiManager;
        
        // 游戏状态
        this.state = 'INIT'; // INIT, PLAYING, PAUSED, GAME_OVER
        this.blocks = [];
        this.cameraY = 0;
        this.targetCameraY = 0;
        
        // 数值统计
        this.score = 0;
        this.layerCount = 0; // 新增单独的层数统计
        this.comboCount = 0;
        this.skipCount = 0;
        this.collectedTrapezoidWords = [];
        this.collectedSpecialWords = [];
        this.availableWords = [...Config.wordPool]; // 拷贝一份词库
        
        // 下一个特殊块的强制生成标记
        this.forceSpecialNext = false;
        this.lastTrapezoidBottomWidth = 0;
        
        // 粒子系统
        this.particles = [];

        // 音频系统
        this.audio = {
            piano: new Audio('resources/music/piano.mp3'),
            drum: new Audio('resources/music/drum.mp3')
        };
        this.audio.piano.loop = true;
        
        // 渲染相关
        this.bgRenderer = new BackgroundRenderer();
        
        this.initGame();
    }

    initGame() {
        this.blocks = [];
        this.score = 0;
        this.layerCount = 0;
        this.comboCount = 0;
        this.skipCount = 0;
        this.collectedTrapezoidWords = [];
        this.collectedSpecialWords = [];
        this.availableWords = [...Config.wordPool];
        this.forceSpecialNext = false;
        
        // 创建基石 (第一块是固定的)
        const baseY = this.canvas.height - Config.blockHeight - 100; // 留点底边
        const baseBlock = new Block(
            (this.canvas.width - Config.initialWidth) / 2,
            baseY,
            Config.initialWidth,
            Config.blockHeight,
            'normal',
            Config.colors.baseBlock,
            '#5c2e0b'
        );
        baseBlock.direction = 0; // 基石不动
        this.blocks.push(baseBlock);
        
        // 相机初始位置
        this.targetCameraY = baseY - this.canvas.height * Config.cameraOffsetY;
        this.cameraY = this.targetCameraY;
        
        // 生成下一个移动的块
        this.spawnNextBlock();
    }

    spawnNextBlock() {
        const lastBlock = this.blocks[this.blocks.length - 1];
        const topEdge = lastBlock.getTopEdge();
        
        let width = topEdge.width;
        let type = 'normal';
        let word = null;
        
        // 判断是否生成特殊块
        if (this.forceSpecialNext) {
            type = 'special';
            width = this.lastTrapezoidBottomWidth; // 吸附梯形下底宽度
            this.forceSpecialNext = false;
        } else if (this.layerCount >= Config.trapezoidStartIndex && Math.random() < Config.trapezoidSpawnRate) {
            type = 'trapezoid';
        } else if (this.layerCount >= Config.trapezoidStartIndex && Math.random() < 0.1) {
            // 梯形解锁后，特殊块也有独立小概率出现
            type = 'special';
        }

        // 如果是梯形或特殊块，分配文字
        if (type === 'trapezoid' || type === 'special') {
            word = this.getRandomWord();
        }

        // 计算生成位置
        let y = lastBlock.y - Config.blockHeight;
        let dir = Math.random() > 0.5 ? 1 : -1;
        let x = dir === 1 ? -width : this.canvas.width;

        // 颜色配置
        let color = Config.colors.normalBlock;
        let borderColor = Config.colors.normalBorder;
        if (type === 'trapezoid') {
            color = Config.colors.trapezoidBlock;
            borderColor = Config.colors.trapezoidBorder;
        } else if (type === 'special') {
            color = Config.colors.specialBlock;
            borderColor = Config.colors.specialBorder;
        }

        const newBlock = new Block(x, y, width, Config.blockHeight, type, color, borderColor);
        newBlock.direction = dir;
        // 增加一点点速度，随着层数增加
        newBlock.speed = Config.slideSpeed + (this.layerCount * 0.05);
        if (word) newBlock.setWord(word);

        this.blocks.push(newBlock);
    }

    getRandomWord() {
        if (this.availableWords.length === 0) return null;
        const index = Math.floor(Math.random() * this.availableWords.length);
        return this.availableWords.splice(index, 1)[0]; // 移除并返回
    }

    // 玩家点击，落下当前方块
    drop() {
        if (this.state !== 'PLAYING') return;
        
        if (navigator.vibrate) {
            navigator.vibrate(50); // 触发短促震动
        }

        // 播放鼓声效
        this.audio.drum.currentTime = 0;
        this.audio.drum.play().catch(e => console.log('Audio error:', e));

        const currentBlock = this.blocks[this.blocks.length - 1];
        const prevBlock = this.blocks[this.blocks.length - 2];
        
        // 重置跳过计数器
        this.skipCount = 0;

        const prevEdge = prevBlock.getTopEdge();
        
        // 检查重叠
        let overlapStart = Math.max(currentBlock.x, prevEdge.left);
        let overlapEnd = Math.min(currentBlock.x + currentBlock.width, prevEdge.right);
        let overlapWidth = overlapEnd - overlapStart;

        // 没重叠，游戏结束
        if (overlapWidth <= 0) {
            this.handleGameOver();
            return;
        }

        // 计算偏差
        const diff = Math.abs(currentBlock.x - prevEdge.left);

        // 完美对齐判定与吸附
        let isPerfect = false;
        if (diff <= Config.perfectTolerance && currentBlock.type !== 'special') {
            isPerfect = true;
            this.comboCount++;
            currentBlock.comboGlow = 1.0; // 开启高亮发光反馈
            currentBlock.x = prevEdge.left; // 强行对齐，完美吸附
            overlapWidth = prevEdge.width;  // 不削减宽度
            
            if (this.comboCount >= Config.comboRequirement) {
                // Combo 奖励：增加宽度
                overlapWidth += Config.comboWidthBonus;
                // 确保不超过画布
                overlapWidth = Math.min(overlapWidth, this.canvas.width);
                currentBlock.width = overlapWidth;
                
                // 确保由于变宽，左边界也可能需要调整以保持居中
                let leftAdjust = Config.comboWidthBonus / 2;
                currentBlock.x = Math.max(0, currentBlock.x - leftAdjust);
                
                this.ui.showCombo();
            }
        } else {
            this.comboCount = 0;
            // 如果不是特殊块，削减宽度；如果是特殊块，不削减且自动吸附
            if (currentBlock.type === 'special') {
                currentBlock.x = prevEdge.left; // 吸附
                overlapWidth = prevEdge.width;
            } else {
                // 削减部分产生碎片粒子
                let slicedWidth = currentBlock.width - overlapWidth;
                if (slicedWidth > 0) {
                    let sliceX = currentBlock.x < prevEdge.left ? currentBlock.x : overlapEnd;
                    this.spawnParticles(sliceX, currentBlock.y, slicedWidth, currentBlock.height, currentBlock.color);
                }

                currentBlock.width = overlapWidth;
                currentBlock.x = overlapStart;
            }
        }
        
        // 更新UI的连击数
        this.ui.updateComboCounter(this.comboCount);

        // 停止移动
        currentBlock.direction = 0;
        
        // 分数计算
        let stepScore = Config.scoreBase;
        if (isPerfect) stepScore += Config.scorePerfect;
        if (this.comboCount > 0) stepScore += this.comboCount * Config.scoreComboMultiplier;

        // 重新检查文字是否被隐藏
        currentBlock.checkTextVisibility();
        if (currentBlock.isWordHidden && currentBlock.word) {
            this.ui.showToast(Config.text.warningWidth);
        }

        // 收集文字
        if (currentBlock.word && !currentBlock.isWordHidden && !currentBlock.wordCollected) {
            currentBlock.wordCollected = true;
            if (currentBlock.type === 'trapezoid') {
                this.collectedTrapezoidWords.push(currentBlock.word);
            } else if (currentBlock.type === 'special') {
                this.collectedSpecialWords.push(currentBlock.word);
            }
            stepScore += Config.scoreWordBonus;
        }

        // 如果放下了梯形块，记录下底并设置下一个为特殊块
        if (currentBlock.type === 'trapezoid') {
            this.forceSpecialNext = true;
            this.lastTrapezoidBottomWidth = currentBlock.width;
        }

        // 得分与层数累加，并更新UI与相机
        this.score += stepScore;
        this.layerCount++;
        this.ui.updateScore(this.score, this.layerCount);
        this.targetCameraY = currentBlock.y - this.canvas.height * Config.cameraOffsetY;

        // 生成下一块
        this.spawnNextBlock();
    }

    // 处理跳过逻辑
    handleSkip() {
        this.skipCount++;
        const currentBlock = this.blocks.pop(); // 移除当前滑出的方块
        
        if (this.skipCount >= Config.maxSkips) {
            this.state = 'PAUSED';
            this.ui.showPenaltyModal();
        } else {
            // 重新生成一个方块从反方向来
            this.spawnNextBlock();
        }
    }

    handleGameOver() {
        this.state = 'GAME_OVER';
        const currentBlock = this.blocks[this.blocks.length - 1];
        currentBlock.direction = 0; 
        this.ui.showGameOver(this.score, this.layerCount, this.collectedTrapezoidWords, this.collectedSpecialWords, this.blocks, this.cameraY);
    }

    // 主更新循环
    update() {
        if (this.state !== 'PLAYING') return;

        // 相机平滑跟随
        this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

        // 更新当前方块位置
        const currentBlock = this.blocks[this.blocks.length - 1];
        if (currentBlock && currentBlock.direction !== 0) {
            const outOfBounds = currentBlock.update(this.canvas.width);
            if (outOfBounds) {
                this.handleSkip();
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawnParticles(x, y, w, h, color) {
        // 在切掉的区域生成若干粗糙质感的粒子
        let count = Math.min(20, Math.max(5, Math.floor(w / 4)));
        for (let i = 0; i < count; i++) {
            let px = x + Math.random() * w;
            let py = y + Math.random() * h;
            this.particles.push(new Particle(px, py, color));
        }
    }

    // 绘制画面
    draw() {
        // 绘制动态背景
        this.bgRenderer.draw(this.ctx, this.canvas.width, this.canvas.height, this.cameraY);
        
        // 绘制所有方块，传递 nextBlock 以实现无缝合并
        for (let i = 0; i < this.blocks.length; i++) {
            const nextBlock = (i + 1 < this.blocks.length) ? this.blocks[i + 1] : null;
            this.blocks[i].draw(this.ctx, this.cameraY, nextBlock);
        }

        // 绘制粒子
        this.particles.forEach(p => p.draw(this.ctx, this.cameraY));
    }
}

// 简单的 2D 物理粒子，用于模拟碎块
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6; // 左右横飞
        this.vy = Math.random() * -4 - 1;    // 向上抛起
        this.size = Math.random() * 6 + 2;   // 随机大小，大一点有水泥碎块感
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02; // 生命衰减
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5; // 重力
        this.life -= this.decay;
    }
    draw(ctx, cameraY) {
        if (this.life <= 0) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x, this.y - cameraY, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

// 静态背景渲染器 (移除了 SVG 生成)
class BackgroundRenderer {
    constructor() {
        this.bgImage = new Image();
        this.bgImage.src = Config.bgImage;
    }
    
    draw(ctx, width, height, cameraY) {
        // 如果图片没有加载好，画个纯色底
        if (!this.bgImage.complete || this.bgImage.naturalWidth === 0) {
            ctx.fillStyle = Config.colors.background;
            ctx.fillRect(0, 0, width, height);
            return;
        }
        
        // 使用 cover 方式居中绘制静态背景
        const imgRatio = this.bgImage.width / this.bgImage.height;
        const canvasRatio = width / height;
        let drawW, drawH, x, y;
        
        if (imgRatio > canvasRatio) {
            drawH = height;
            drawW = height * imgRatio;
            x = (width - drawW) / 2;
            y = 0;
        } else {
            drawW = width;
            drawH = width / imgRatio;
            x = 0;
            y = (height - drawH) / 2;
        }
        
        ctx.drawImage(this.bgImage, x, y, drawW, drawH);
    }
}
