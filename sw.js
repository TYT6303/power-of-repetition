// sw.js - 修复后的 Service Worker
const CACHE_NAME = 'power-of-repetition-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装阶段
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活阶段 - 清除旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 请求拦截 - 修复 chrome-extension 错误
self.addEventListener('fetch', event => {
  // 过滤掉 chrome-extension 协议
  if (event.request.url.startsWith('chrome-extension://')) {
    return; // 直接忽略，不缓存
  }
  
  // 过滤掉 data: 协议
  if (event.request.url.startsWith('data:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // 只缓存成功的请求
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});
