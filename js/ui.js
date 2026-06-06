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

    // 导出战绩图片 (绘制内存Canvas并下载)
    exportPolaroid(score, trapezoidWords, specialWords, gameCanvasCtx, canvasWidth, canvasHeight) {
        const ctx = this.exportCanvas.getContext('2d');
        
        // 设置图片尺寸
        this.exportCanvas.width = canvasWidth;
        this.exportCanvas.height = canvasHeight;
        
        // === 绘制虚化背景 ===
        ctx.filter = 'blur(10px) brightness(0.6)';
        ctx.drawImage(gameCanvasCtx.canvas, 0, 0, canvasWidth, canvasHeight);
        ctx.filter = 'none'; // 恢复

        // === 绘制半透明黑色遮罩，增加文字可读性 ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // === 绘制中心战绩卡片 ===
        const cardWidth = canvasWidth * 0.8;
        const cardHeight = canvasHeight * 0.7;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        
        // 圆角矩形卡片
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // === 绘制文字信息 ===
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        
        // 标题
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(Config.text.gameName, canvasWidth / 2, cardY + 50);
        
        // 成绩
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#FF5722';
        ctx.fillText(`${score}`, canvasWidth / 2, cardY + 120);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('总得分', canvasWidth / 2, cardY + 145);

        // 双列词汇表标题
        const colY = cardY + 190;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText('基础收集', cardX + cardWidth * 0.25, colY);
        ctx.fillText('特殊收集', cardX + cardWidth * 0.75, colY);

        // 双列词汇绘制逻辑
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#555';
        
        const drawColumn = (words, xOffset) => {
            let limit = Math.min(words.length, 8); // 最多显示8个防止溢出
            for (let i = 0; i < limit; i++) {
                ctx.fillText(words[i], cardX + cardWidth * xOffset, colY + 30 + i * 25);
            }
            if (words.length > 8) {
                ctx.fillText('...', cardX + cardWidth * xOffset, colY + 30 + limit * 25);
            }
            if (words.length === 0) {
                ctx.fillText('无', cardX + cardWidth * xOffset, colY + 30);
            }
        };

        drawColumn(trapezoidWords, 0.25);
        drawColumn(specialWords, 0.75);
        
        // 转为 Base64 下载
        try {
            const dataUrl = this.exportCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `字筑高塔_战绩_${score}层.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            alert('导出图片失败，可能是环境限制。');
            console.error(e);
        }
    }
}
