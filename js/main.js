window.onload = () => {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-container');
    
    // 设置画布尺寸适应容器，且固定内部逻辑宽度为 600
    function resizeCanvas() {
        const logicalWidth = 600;
        const aspect = container.clientHeight / container.clientWidth;
        
        // 锁定逻辑宽度，高度按比例缩放，保证横向始终能一屏显示完
        canvas.width = logicalWidth;
        canvas.height = logicalWidth * aspect;
        
        // 如果引擎已经初始化，可能需要触发重绘，这里依赖下一次 loop 即可
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 初始化 UI 和 引擎
    const ui = new UIManager();
    const engine = new GameEngine(canvas, ui);

    // 绑定 UI 按钮回调
    ui.bindEvents({
        onStart: () => {
            engine.state = 'PLAYING';
            engine.initGame();
            engine.audio.piano.play().catch(e => console.log('自动播放被拦截:', e));
        },
        onResume: () => {
            engine.state = 'PLAYING';
            engine.skipCount = 0; // 重置跳过次数
            engine.spawnNextBlock(); // 重新生成方块
            engine.audio.piano.play().catch(e => console.log('自动播放被拦截:', e));
        },
        onRestart: () => {
            engine.initGame();
            engine.state = 'PLAYING';
            ui.updateScore(0, 0);
            ui.updateComboCounter(0);
            engine.audio.piano.play().catch(e => console.log('自动播放被拦截:', e));
        },
        onExport: () => {
            ui.exportPolaroid(engine.score, engine.collectedTrapezoidWords, engine.collectedSpecialWords, engine, canvas.width, canvas.height);
        }
    });

    // 绑定游戏交互 (点击/触摸落下)
    const handleInput = (e) => {
        // 防止点到 UI 按钮时也触发落下
        if (e.target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        engine.drop();
    };

    container.addEventListener('mousedown', handleInput);
    container.addEventListener('touchstart', handleInput, { passive: false });

    // 阻止右键菜单和长按选中文本等默认行为
    container.addEventListener('contextmenu', e => e.preventDefault());

    // 游戏主循环
    function gameLoop() {
        if (engine.state === 'INIT') {
            ui.showTutorial();
        } else {
            engine.update();
            engine.draw();
        }
        
        requestAnimationFrame(gameLoop);
    }

    // 启动游戏
    engine.initGame();
    engine.state = 'INIT'; // 等待玩家点击开始
    requestAnimationFrame(gameLoop);
};
