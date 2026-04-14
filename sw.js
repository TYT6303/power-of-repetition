// sw.js - Service Worker for "重复的力量"
const CACHE_NAME = 'repeat-power-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // 如果后续拆分出独立 CSS/JS 文件，请在此添加，如：'./css/style.css'
];

// 1️⃣ 安装：预缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 预缓存核心资源');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting()) // 跳过等待，立即激活
  );
});

// 2️⃣ 激活：清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('🗑️ 清理旧缓存:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即接管所有页面
  );
});

// 3️⃣ 拦截请求：缓存优先 + 网络兜底
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // ✅ 缓存命中：直接返回
        if (cached) return cached;

        // 🌐 未命中：发起网络请求
        return fetch(event.request).then(response => {
          // 只缓存成功的页面请求
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 克隆响应并写入缓存（供下次使用）
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          
          return response;
        }).catch(() => {
          // 🚫 网络失败 + 无缓存：返回离线页（即首页）
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
