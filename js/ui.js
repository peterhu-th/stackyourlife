class UIManager {
    constructor() {
        // DOM 元素引用
        this.scoreDisplay = document.getElementById('score-display');
        this.layerDisplay = document.getElementById('layer-display');
        this.toastMsg = document.getElementById('toast-message');
        this.comboMsg = document.getElementById('combo-message');
        this.comboCounter = document.getElementById('combo-counter');
        this.comboNum = document.getElementById('combo-num');
        
        this.tutorialModal = document.getElementById('tutorial-modal');
        this.tutorialText = document.getElementById('tutorial-text');
        this.startBtn = document.getElementById('start-btn');
        
        this.penaltyModal = document.getElementById('penalty-modal');
        this.penaltyText = document.getElementById('penalty-text');
        this.resumeBtn = document.getElementById('resume-btn');
        
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreNum = document.getElementById('final-score-num');
        this.finalLayerNum = document.getElementById('final-layer-num');
        this.trapezoidWordsList = document.getElementById('trapezoid-words-list');
        this.specialWordsList = document.getElementById('special-words-list');
        this.restartBtn = document.getElementById('restart-btn');
        this.exportBtn = document.getElementById('export-btn');
        
        this.exportCanvas = document.getElementById('export-canvas');
        
        // 初始化文案
        this.tutorialText.innerText = Config.text.welcome;
        this.penaltyText.innerText = Config.text.warningPassive;
        
        this.toastTimeout = null;
    }

    bindEvents(callbacks) {
        this.startBtn.addEventListener('click', () => {
            this.hideAllModals();
            callbacks.onStart();
        });
        
        this.resumeBtn.addEventListener('click', () => {
            this.hideAllModals();
            callbacks.onResume();
        });
        
        this.restartBtn.addEventListener('click', () => {
            this.hideAllModals();
            callbacks.onRestart();
        });
        
        this.exportBtn.addEventListener('click', () => {
            callbacks.onExport();
        });
    }

    hideAllModals() {
        this.tutorialModal.classList.add('hidden');
        this.penaltyModal.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
    }

    showTutorial() {
        this.hideAllModals();
        this.tutorialModal.classList.remove('hidden');
    }

    showPenaltyModal() {
        this.hideAllModals();
        this.penaltyModal.classList.remove('hidden');
    }

    showGameOver(score, layer, trapezoidWords, specialWords) {
        this.hideAllModals();
        this.finalScoreNum.innerText = score;
        this.finalLayerNum.innerText = layer;
        
        // 渲染基础收集词汇
        this.trapezoidWordsList.innerHTML = '';
        if (trapezoidWords.length === 0) {
            this.trapezoidWordsList.innerHTML = '<li>无</li>';
        } else {
            trapezoidWords.forEach(word => {
                const li = document.createElement('li');
                li.innerText = word;
                this.trapezoidWordsList.appendChild(li);
            });
        }

        // 渲染特殊收集词汇
        this.specialWordsList.innerHTML = '';
        if (specialWords.length === 0) {
            this.specialWordsList.innerHTML = '<li>无</li>';
        } else {
            specialWords.forEach(word => {
                const li = document.createElement('li');
                li.innerText = word;
                this.specialWordsList.appendChild(li);
            });
        }
        
        this.gameOverModal.classList.remove('hidden');
    }

    updateScore(score, layer) {
        this.scoreDisplay.innerText = score;
        this.layerDisplay.innerText = `第 ${layer} 层`;
    }

    updateComboCounter(count) {
        if (count > 0) {
            this.comboNum.innerText = count;
            this.comboCounter.classList.remove('hidden');
            
            // 添加跳动动画
            this.comboCounter.style.transform = 'translateX(-50%) scale(1.2)';
            setTimeout(() => {
                if (this.comboCounter) {
                    this.comboCounter.style.transform = 'translateX(-50%) scale(1)';
                }
            }, 100);
        } else {
            this.comboCounter.classList.add('hidden');
        }
    }

    showToast(message) {
        this.toastMsg.innerText = message;
        this.toastMsg.classList.remove('hidden');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toastMsg.classList.add('hidden');
        }, 2000);
    }

    showCombo() {
        const text = Config.text.comboTexts[Math.floor(Math.random() * Config.text.comboTexts.length)];
        this.comboMsg.innerText = text;
        this.comboMsg.classList.remove('hidden');
        
        // 触发动画重置
        this.comboMsg.style.animation = 'none';
        this.comboMsg.offsetHeight; // trigger reflow
        this.comboMsg.style.animation = null;

        setTimeout(() => {
            this.comboMsg.classList.add('hidden');
        }, 1000);
    }

    // 导出战绩图片 (词云图)
    exportPolaroid(score, trapezoidWords, specialWords, engine, canvasWidth, canvasHeight) {
        const ctx = this.exportCanvas.getContext('2d');
        
        // 设置图片尺寸
        this.exportCanvas.width = canvasWidth;
        this.exportCanvas.height = canvasHeight;
        
        // === 1. 绘制当前阶段的纯净背景 ===
        engine.bgRenderer.draw(ctx, canvasWidth, canvasHeight, engine.cameraY);

        // === 2. 绘制一层轻微的遮罩，保证文字清晰 ===
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // === 3. 绘制标题和分数 ===
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 游戏名和分数在顶部
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText(Config.text.gameName, canvasWidth / 2, 60);
        
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#FF5722';
        ctx.fillText(`${score} 分`, canvasWidth / 2, 120);

        // === 4. 绘制词云 ===
        const allWords = [...trapezoidWords, ...specialWords];
        if (allWords.length > 0) {
            // 词云色盘 (较深的马卡龙色以保证在浅色背景上可见)
            const colors = ['#E57373', '#F06292', '#BA68C8', '#7986CB', '#4FC3F7', '#4DB6AC', '#81C784', '#FF8A65'];
            const placedBoxes = []; // 用于碰撞检测的边界框数组
            
            // 为标题和分数预留空间
            placedBoxes.push({
                x: canvasWidth / 2,
                y: 90,
                w: 300,
                h: 150
            });

            // 随机打乱单词顺序
            allWords.sort(() => Math.random() - 0.5);

            for (let word of allWords) {
                // 随机大小和颜色
                const isSpecial = specialWords.includes(word);
                const fontSize = isSpecial ? (Math.floor(Math.random() * 20) + 36) : (Math.floor(Math.random() * 20) + 20); // 特殊词汇更大
                ctx.font = `bold ${fontSize}px sans-serif`;
                const metrics = ctx.measureText(word);
                const w = metrics.width + 10; // 加点 padding
                const h = fontSize + 10;
                
                let placed = false;
                let angle = Math.random() * Math.PI * 2;
                let radius = 0;
                const maxRadius = Math.min(canvasWidth, canvasHeight);
                
                // 螺旋形寻位
                while (radius < maxRadius) {
                    let x = canvasWidth / 2 + Math.cos(angle) * radius;
                    let y = canvasHeight / 2 + 50 + Math.sin(angle) * radius; // 中心偏下
                    
                    // 检查是否超出边界
                    if (x - w/2 > 20 && x + w/2 < canvasWidth - 20 && y - h/2 > 160 && y + h/2 < canvasHeight - 20) {
                        // 碰撞检测
                        let collision = false;
                        for (let box of placedBoxes) {
                            if (!(x + w/2 < box.x - box.w/2 || 
                                  x - w/2 > box.x + box.w/2 || 
                                  y + h/2 < box.y - box.h/2 || 
                                  y - h/2 > box.y + box.h/2)) {
                                collision = true;
                                break;
                            }
                        }
                        
                        if (!collision) {
                            placedBoxes.push({x, y, w, h});
                            
                            // 绘制文字 (带白边使其更清晰)
                            ctx.font = `bold ${fontSize}px sans-serif`;
                            ctx.lineWidth = 4;
                            ctx.strokeStyle = 'white';
                            ctx.strokeText(word, x, y);
                            
                            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                            ctx.fillText(word, x, y);
                            
                            placed = true;
                            break;
                        }
                    }
                    
                    angle += 0.5;
                    radius += 3;
                }
            }
        } else {
            // 没有收集到词汇
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('没有收集到任何词汇哦', canvasWidth / 2, canvasHeight / 2);
        }

        // 转为 Base64 下载
        try {
            const dataUrl = this.exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            
            // 按照时间_分数命名
            const now = new Date();
            const timeStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
            link.download = `${timeStr}_${score}.png`;
            
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('导出成功');
        } catch (e) {
            alert('导出图片失败，可能是环境限制。');
            console.error(e);
        }
    }
}
