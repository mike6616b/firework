// 取得 canvas 元素和 2D 繪圖環境
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d'); // ctx 是 context 的縮寫，是慣用名稱

// 設定畫布尺寸為視窗大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定義粒子數組和鼠標位置
const particles = [];
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let prevMouseX = mouseX;
let prevMouseY = mouseY;
let isMoving = false;
let moveTimeout;

// 定義典雅金色系列的顏色
const elegantColors = [
    '#d4af37', // 真金色
    '#ffd700', // 金色
    '#f0e68c', // 卡其色
    '#daa520', // 金菊色
    '#b8860b'  // 暗金色
];

// 滑鼠追蹤點的屬性
const pointer = {
    x: mouseX,
    y: mouseY,
    radius: 8, // 更小的跟隨點
    color: elegantColors[0]
};

// 尾巴點的類別
class TrailPoint {
    constructor(x, y, age = 0) {
        this.x = x;
        this.y = y;
        this.age = age; // 用於控制透明度和大小
        this.maxAge = 50; // 進一步增加尾巴點的最大生命周期
    }

    // 更新尾巴點的生命週期
    update() {
        this.age++;
        return this.age < this.maxAge;
    }

    // 繪製尾巴點
    draw() {
        const ageRatio = this.age / this.maxAge;
        const opacity = 1 - ageRatio;
        // 隨著年齡增加，半徑慢慢減小
        const radius = pointer.radius * (1 - ageRatio * 0.8);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        
        // 創建從中心向外漸變透明的效果
        const trailGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, radius
        );
        
        trailGradient.addColorStop(0, `rgba(212, 175, 55, ${opacity})`);
        trailGradient.addColorStop(1, `rgba(212, 175, 55, ${opacity * 0.5})`); // 邊緣50%的透明度
        
        ctx.fillStyle = trailGradient;
        ctx.fill();
    }
}

// 粒子類別（用於煙火效果）
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2; // 略微增大粒子尺寸
        this.speedX = 0; // 初始速度，在createFirework中設定
        this.speedY = 0; // 初始速度，在createFirework中設定
        this.color = elegantColors[Math.floor(Math.random() * elegantColors.length)];
        this.life = 70 + Math.random() * 60; // 減少一些粒子壽命
        this.maxLife = this.life;
        this.initialX = x;
        this.initialY = y;
        this.trail = []; // 儲存粒子的尾巴路徑
        this.trailLength = 15 + Math.floor(Math.random() * 20); // 減少尾巴長度以提高性能
        this.gravity = 0.03; // 添加重力效果
        this.decay = 0.99; // 慢一點的減速率，產生更長的路徑
        
        // 預先添加初始位置到尾巴
        this.trail.push({x: this.x, y: this.y});
    }

    // 更新粒子位置和生命週期
    update() {
        // 儲存當前位置到尾巴，但不是每一幀都存儲
        if (Math.random() < 0.7) { // 只有70%的幀會記錄位置，減少尾巴點數量
            this.trail.push({x: this.x, y: this.y});
            
            // 限制尾巴長度
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
        }
        
        // 更新位置
        this.x += this.speedX;
        this.y += this.speedY;
        
        // 添加重力效果，讓煙火有拋物線運動
        this.speedY += this.gravity;
        
        // 粒子逐漸減速
        this.speedX *= this.decay;
        this.speedY *= this.decay;
        
        // 減少生命值
        this.life--;
        
        return this.life > 0;
    }

    // 繪製粒子及其尾巴
    draw() {
        const headOpacity = this.life / this.maxLife;
        
        // 繪製尾巴 - 減少繪製點數量以提高性能
        if (this.trail.length > 1) {
            // 只繪製一部分點，而不是所有點
            const step = Math.max(1, Math.floor(this.trail.length / 8));
            
            for (let i = 0; i < this.trail.length - 1; i += step) {
                // 確保索引不越界
                const nextIndex = Math.min(i + step, this.trail.length - 1);
                
                // 計算每個尾巴點的透明度，尾端為30%透明度
                const pointIndex = i / this.trail.length;
                const tailOpacity = headOpacity * (0.3 + (0.7 * pointIndex));
                
                // 尾巴線寬從細到粗
                const lineWidth = this.size * (0.3 + (pointIndex * 0.7));
                
                ctx.beginPath();
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
                ctx.lineTo(this.trail[nextIndex].x, this.trail[nextIndex].y);
                ctx.strokeStyle = this.color + Math.floor(tailOpacity * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }
        }
        
        // 繪製粒子本身
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * headOpacity, 0, Math.PI * 2);
        
        // 簡化粒子頭部，不使用漸變
        ctx.fillStyle = this.color + Math.floor(headOpacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // 只在前半生命週期添加發光效果
        if (headOpacity > 0.7 && Math.random() < 0.5) { // 隨機添加發光效果
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// 尾巴點數組
const trail = [];

// 產生煙火爆炸效果
function createFirework(x, y) {
    // 進一步減少粒子數量
    const particleCount = 8 + Math.floor(Math.random() * 6);
    
    // 生成一組向四面八方發射的粒子，模擬爆炸效果
    for (let i = 0; i < particleCount; i++) {
        // 計算角度，使粒子向各個方向發射
        const angle = (i / particleCount) * Math.PI * 2;
        
        // 計算隨機速度，使煙火有不同的爆炸半徑
        const speed = 4 + Math.random() * 4;
        
        // 根據角度和速度計算初始速度向量
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        
        // 創建具有指定方向和速度的粒子
        const particle = new Particle(x, y);
        particle.speedX = speedX;
        particle.speedY = speedY;
        
        // 添加到粒子數組
        particles.push(particle);
    }
}

// 產生大型煙火爆炸
function createBigFirework(x, y) {
    // 大型爆炸粒子數量也適度減少
    const particleCount = 16 + Math.floor(Math.random() * 8);
    
    // 生成一組向四面八方發射的粒子，模擬爆炸效果
    for (let i = 0; i < particleCount; i++) {
        // 計算角度，使粒子向各個方向發射
        const angle = (i / particleCount) * Math.PI * 2;
        
        // 使用更大的初始速度
        const speed = 5 + Math.random() * 7;
        
        // 根據角度和速度計算初始速度向量
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        
        // 創建具有指定方向和速度的粒子
        const particle = new Particle(x, y);
        particle.speedX = speedX;
        particle.speedY = speedY;
        particle.size = Math.random() * 4 + 2; // 稍大一些的粒子
        particle.trailLength = 20 + Math.floor(Math.random() * 25); // 更長的尾巴
        
        // 添加到粒子數組
        particles.push(particle);
    }
}

// 動畫循環 - 添加性能優化
function animate() {
    // 檢查粒子數量，如果太多可能導致效能問題，則移除一些
    if (particles.length > 200) {
        // 移除最早產生的粒子
        particles.splice(0, particles.length - 200);
    }
    
    // 漸隱效果，進一步減慢消失速度讓粒子停留更久
    ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新指針位置（緩和移動）
    pointer.x += (mouseX - pointer.x) * 0.2;
    pointer.y += (mouseY - pointer.y) * 0.2;
    
    // 添加新的尾巴點，但要控制頻率
    if (isMoving && Math.random() < 0.6) { // 只有60%的幾率添加尾巴點
        trail.unshift(new TrailPoint(pointer.x, pointer.y));
    }
    
    // 更新和繪製尾巴
    for (let i = trail.length - 1; i >= 0; i--) {
        if (!trail[i].update()) {
            trail.splice(i, 1);
        } else {
            trail[i].draw();
        }
    }
    
    // 更新和繪製粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        } else {
            particles[i].draw();
        }
    }
    
    // 繪製主要指標
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
    
    // 創建一個金色漸變填充，從中心向外越來越透明
    const gradient = ctx.createRadialGradient(
        pointer.x, pointer.y, 0,
        pointer.x, pointer.y, pointer.radius
    );
    gradient.addColorStop(0, elegantColors[1]); // 明亮的金色中心
    gradient.addColorStop(0.7, elegantColors[0]); // 真金色中間區域
    gradient.addColorStop(1, elegantColors[0] + '80'); // 50%透明的金色邊緣
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 添加發光效果
    ctx.shadowBlur = 10;
    ctx.shadowColor = elegantColors[0];
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    requestAnimationFrame(animate);
}

// 使用 Hammer.js 處理觸控事件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化 Hammer 實例
    const hammertime = new Hammer(canvas);
    
    // 配置 Hammer 以檢測平移（滑動）手勢
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 8 });
    
    // 定義生成粒子的計時器
    let lastParticleTime = 0;
    const particleInterval = 80; // 增加間隔時間，減少粒子生成頻率
    
    // 處理平移（滑動）事件
    hammertime.on('panstart panmove', function(ev) {
        // 更新前一個位置
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        
        // 更新當前位置
        mouseX = ev.center.x;
        mouseY = ev.center.y;
        
        isMoving = true;
        
        const currentTime = Date.now();
        // 只在移動足夠距離且時間間隔足夠時才生成粒子
        const distance = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
        if (distance > 10 && currentTime - lastParticleTime > particleInterval) {
            createFirework(mouseX, mouseY);
            lastParticleTime = currentTime;
        }
    });
    
    // 處理平移結束事件
    hammertime.on('panend', function(ev) {
        isMoving = false;
        createBigFirework(ev.center.x, ev.center.y);
    });
    
    // 處理點擊事件
    hammertime.on('tap', function(ev) {
        createBigFirework(ev.center.x, ev.center.y);
    });
    
    // 處理滑鼠事件（對於非觸控設備）
    if (!('ontouchstart' in window)) {
        canvas.addEventListener('mousemove', function(e) {
            prevMouseX = mouseX;
            prevMouseY = mouseY;
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            isMoving = true;
            clearTimeout(moveTimeout);
            
            const currentTime = Date.now();
            const distance = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
            if (distance > 10 && currentTime - lastParticleTime > particleInterval) {
                createFirework(mouseX, mouseY);
                lastParticleTime = currentTime;
            }
            
            moveTimeout = setTimeout(function() {
                isMoving = false;
            }, 100);
        });
        
        canvas.addEventListener('click', function(e) {
            createBigFirework(e.clientX, e.clientY);
        });
    }
    
    // 開始動畫循環
    animate();
});

// 監聽視窗大小變化事件，重新設定畫布大小
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
