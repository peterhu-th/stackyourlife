class Block {
    constructor(x, y, width, height, type = 'normal', color = '#333', borderColor = '#000') {
        this.x = x;           // 方块左上角X坐标
        this.y = y;           // 方块左上角Y坐标
        this.width = width;   // 方块下底宽度
        this.height = height; // 方块高度
        this.type = type;     // 'normal', 'trapezoid', 'special'
        this.color = color;   // 方块颜色
        this.borderColor = borderColor; // 方块边框色
        this.direction = Math.random() > 0.5 ? 1 : -1; // 1为向右，-1为向左
        this.speed = Config.slideSpeed;
        
        this.comboGlow = 0;   // Combo 发光计时器
        
        // 梯形块特有属性：上底宽度缩减量（每边缩减的像素）
        this.trapezoidIndent = 0;
        if (this.type === 'trapezoid') {
            // 梯形上底比下底短，随机缩减 5-15 像素（单边）
            this.trapezoidIndent = Math.floor(Math.random() * 11) + 5; 
            // 确保不会缩成负数
            if (this.width - this.trapezoidIndent * 2 < 10) {
                this.trapezoidIndent = Math.max(0, (this.width - 10) / 2);
            }
        }

        // 文字收集属性
        this.word = null;
        this.isWordHidden = false;
        this.wordCollected = false;
    }

    // 设置文字
    setWord(word) {
        this.word = word;
        this.checkTextVisibility();
    }

    // 检查是否因为太窄需要隐藏文字
    checkTextVisibility() {
        if (this.word && this.width < Config.minTextWidth) {
            this.isWordHidden = true;
        } else {
            this.isWordHidden = false;
        }
    }

    // 更新位置（左右平移）
    update(canvasWidth) {
        this.x += this.speed * this.direction;
        // 碰到边界反弹，或者实现“滑过屏幕即消失”的逻辑
        // 根据 GDD，如果滑出屏幕，则从反方向出现并算作跳过
        if (this.x > canvasWidth || this.x + this.width < 0) {
            return true; // 返回 true 表示滑出了屏幕
        }
        return false;
    }

    // 在画布上绘制无缝圆角多边形
    draw(ctx, cameraY, nextBlock) {
        const renderY = this.y - cameraY;
        const r = Config.blockCornerRadius;
        
        let topX1, topX2;
        // 如果上面有方块并且已经落定，则当前方块的上边缘与上方块的下边缘完全贴合
        if (nextBlock && nextBlock.direction === 0) {
            topX1 = nextBlock.x;
            topX2 = nextBlock.x + nextBlock.width;
        } else {
            // 如果是顶层方块，或者上方的方块还在移动，则使用自己的原始顶角
            topX1 = this.type === 'trapezoid' ? this.x + this.trapezoidIndent : this.x;
            topX2 = this.type === 'trapezoid' ? this.x + this.width - this.trapezoidIndent : this.x + this.width;
        }

        const points = [
            { x: topX1, y: renderY },
            { x: topX2, y: renderY },
            { x: this.x + this.width, y: renderY + this.height },
            { x: this.x, y: renderY + this.height }
        ];

        ctx.fillStyle = this.color;
        ctx.beginPath();
        // 从左边线中点开始
        ctx.moveTo((points[3].x + points[0].x) / 2, (points[3].y + points[0].y) / 2);
        
        for (let i = 0; i < 4; i++) {
            let p1 = points[i];
            let p2 = points[(i + 1) % 4];
            ctx.arcTo(p1.x, p1.y, p2.x, p2.y, r);
        }
        
        ctx.closePath();

        // 完美 Combo 发光特效
        if (this.comboGlow > 0) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = this.comboGlow * 20;
            this.comboGlow = Math.max(0, this.comboGlow - 0.05); // 每帧衰减
        } else if (this.type === 'special') {
            // 特殊块自带轻微泛光
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        ctx.fill();

        // 绘制普通方块的水泥砖纹理 (极淡的水平线)
        if (this.type === 'normal') {
            ctx.save();
            ctx.clip(); // 限制在圆角多边形内
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            for (let ly = renderY + 5; ly < renderY + this.height; ly += 8) {
                ctx.beginPath();
                ctx.moveTo(this.x, ly);
                ctx.lineTo(this.x + this.width, ly);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 绘制像素边框
        ctx.shadowBlur = 0; // 边框不发光
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制文字 (梯形或特殊块)
        if (this.word && !this.isWordHidden) {
            ctx.fillStyle = Config.colors.text;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let topWidth = topX2 - topX1;
            let centerX = (topX1 + topX2 + this.x + this.x + this.width) / 4;
            let centerY = renderY + (this.height / 2);
            
            // 只有当顶边足够宽时才绘制
            if (topWidth >= 16) {
                ctx.fillText(this.word, centerX, centerY);
            }
        }
    }

    // 获取方块顶部的有效范围 (用于下一块的堆叠判定)
    getTopEdge() {
        if (this.type === 'trapezoid') {
            return {
                left: this.x + this.trapezoidIndent,
                right: this.x + this.width - this.trapezoidIndent,
                width: this.width - this.trapezoidIndent * 2
            };
        }
        return {
            left: this.x,
            right: this.x + this.width,
            width: this.width
        };
    }
}
