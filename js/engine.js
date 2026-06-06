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
        
        // 渲染相关
        this.hue = Math.floor(Math.random() * 360);
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
            Config.colors.baseBlock
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

        // 颜色渐变
        this.hue = (this.hue + Config.colors.hueSpeed) % 360;
        let color = `hsl(${this.hue}, ${Config.colors.saturation}, ${Config.colors.lightness})`;

        const newBlock = new Block(x, y, width, Config.blockHeight, type, color);
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
    }
}

// 动态背景渲染器
class BackgroundRenderer {
    constructor() {
        this.stars = Array.from({length: 80}, () => ({
            x: Math.random(), 
            y: Math.random() * 5000 + Config.bgAltitudes.cloud, // 在云层上方分布
            size: Math.random() * 2 + 1
        }));
        this.clouds = Array.from({length: 20}, () => ({
            x: Math.random(),
            y: Math.random() * 2500 + Config.bgAltitudes.mountain, // 山脉到星系之间分布
            width: Math.random() * 80 + 50
        }));
        
        // 缓存 SVG 实体背景 Image 对象
        this.images = {
            grass: new Image(),
            city: new Image(),
            mountain: new Image(),
            galaxy: new Image()
        };
        this.images.grass.src = Config.bgEntities.grass;
        this.images.city.src = Config.bgEntities.city;
        this.images.mountain.src = Config.bgEntities.mountain;
        this.images.galaxy.src = Config.bgEntities.galaxy;
    }
    
    draw(ctx, width, height, cameraY) {
        let altTop = -cameraY + height;
        let altBottom = -cameraY;

        // 1. 绘制渐变背景底色
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, this.getColor(altTop));
        grad.addColorStop(1, this.getColor(altBottom));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. 绘制视差粒子 (云、星星)
        this.drawParticles(ctx, width, height, cameraY);
        
        // 3. 绘制实体背景 (SVG Images, 附带淡入淡出与轻微视差)
        this.drawEntities(ctx, width, height, altBottom);
    }

    drawParticles(ctx, width, height, cameraY) {
        // --- 云朵 ---
        this.clouds.forEach(c => {
            let cRenderY = -c.y - cameraY * 0.6; // 强视差
            if (cRenderY > -50 && cRenderY < height + 50) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.beginPath();
                ctx.arc(c.x * width, cRenderY, c.width/2, 0, Math.PI * 2);
                ctx.arc(c.x * width - c.width*0.4, cRenderY + c.width*0.1, c.width*0.3, 0, Math.PI*2);
                ctx.arc(c.x * width + c.width*0.4, cRenderY + c.width*0.1, c.width*0.3, 0, Math.PI*2);
                ctx.fill();
            }
        });

        // --- 星星 ---
        ctx.fillStyle = '#ffffff';
        this.stars.forEach(s => {
            let sRenderY = -s.y - cameraY * 0.4; // 极强视差
            if (sRenderY > -10 && sRenderY < height + 10) {
                ctx.beginPath();
                ctx.arc(s.x * width, sRenderY, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawEntities(ctx, width, height, alt) {
        // 渲染单个实体的辅助函数
        const drawImg = (img, alpha, targetAlt) => {
            if (alpha <= 0.01) return; // 优化：完全透明时不渲染
            if (!img.complete || img.naturalWidth === 0) return; // 确保加载完成
            
            ctx.save();
            ctx.globalAlpha = alpha;
            // 固定大小比例 1.2 倍
            const imgW = img.width * 1.2;
            const imgH = img.height * 1.2;
            
            // 加入轻微视差：随着海拔偏离目标值，实体稍微向下移动
            const parallaxY = (alt - targetAlt) * 0.1;
            const x = (width - imgW) / 2;
            const y = height - imgH - 50 + parallaxY;
            
            ctx.drawImage(img, x, y, imgW, imgH);
            ctx.restore();
        };

        const cityAlt = Config.bgAltitudes.city;
        const mountainAlt = Config.bgAltitudes.mountain;
        const galaxyAlt = Config.bgAltitudes.galaxy;
        
        // 过渡区间高度（即淡入淡出持续的海拔跨度）
        const fadeRange = 400; 

        // 1. 草原实体 (大树) - 默认显示，进入城市前淡出
        let grassAlpha = 1.0;
        if (alt > cityAlt - fadeRange) grassAlpha = 1 - (alt - (cityAlt - fadeRange)) / fadeRange;
        if (alt > cityAlt) grassAlpha = 0;
        drawImg(this.images.grass, grassAlpha, 0);

        // 2. 城市实体 (高楼) - 城市区间淡入，山脉区间淡出
        let cityAlpha = 0;
        if (alt > cityAlt - fadeRange && alt <= cityAlt) {
            cityAlpha = (alt - (cityAlt - fadeRange)) / fadeRange;
        } else if (alt > cityAlt && alt <= mountainAlt - fadeRange) {
            cityAlpha = 1.0;
        } else if (alt > mountainAlt - fadeRange && alt <= mountainAlt) {
            cityAlpha = 1 - (alt - (mountainAlt - fadeRange)) / fadeRange;
        }
        drawImg(this.images.city, Math.max(0, Math.min(1, cityAlpha)), cityAlt);

        // 3. 山脉实体 (雪山) - 山脉区间淡入，星空区间淡出
        let mountainAlpha = 0;
        if (alt > mountainAlt - fadeRange && alt <= mountainAlt) {
            mountainAlpha = (alt - (mountainAlt - fadeRange)) / fadeRange;
        } else if (alt > mountainAlt && alt <= galaxyAlt - fadeRange) {
            mountainAlpha = 1.0;
        } else if (alt > galaxyAlt - fadeRange && alt <= galaxyAlt) {
            mountainAlpha = 1 - (alt - (galaxyAlt - fadeRange)) / fadeRange;
        }
        drawImg(this.images.mountain, Math.max(0, Math.min(1, mountainAlpha)), mountainAlt);

        // 4. 星空实体 (星球) - 星空区间淡入
        let galaxyAlpha = 0;
        if (alt > galaxyAlt - fadeRange && alt <= galaxyAlt) {
            galaxyAlpha = (alt - (galaxyAlt - fadeRange)) / fadeRange;
        } else if (alt > galaxyAlt) {
            galaxyAlpha = 1.0;
        }
        drawImg(this.images.galaxy, Math.max(0, Math.min(1, galaxyAlpha)), galaxyAlt);
    }

    getColor(alt) {
        if (alt < Config.bgAltitudes.city) return '#c8e6c9'; // 草原：清新浅绿
        if (alt < Config.bgAltitudes.mountain) return '#bbdefb'; // 城市上空：清澈浅蓝
        if (alt < Config.bgAltitudes.cloud) return '#90caf9'; // 山脉上空：稍深的天蓝
        if (alt < Config.bgAltitudes.galaxy) return '#3f51b5'; // 云层上空：深蓝
        return '#1a237e'; // 星系：暗夜紫蓝
    }
}
