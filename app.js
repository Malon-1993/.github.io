document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const loginPopup = document.getElementById('loginPopup');
    const closePopupBtn = document.getElementById('closePopup');
    const backButton = document.getElementById('backButton');
    const iframes = document.querySelectorAll('iframe');
    const subTabs = document.querySelectorAll('.sub-tab');
    const subPages = document.querySelectorAll('.sub-page');
    
    // 页面历史记录
    let pageHistory = ['home'];
    
    // iframe URL历史记录
    const iframeHistory = {
        home: [],
        pushRecords: [],
        profile: [],
        candidateList: [],
        carRentalList: []
    };
    
    // 显示登录弹窗
    showLoginPopup();
    
    // 加载 iframe 内容并设置历史记录监听
    loadIframeContentWithHistory();
    
    // 监听浏览器的后退前进按钮
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.pageId && event.state.iframeUrl) {
            const { pageId, iframeUrl } = event.state;
            console.log('检测到浏览器返回/前进操作:', pageId, iframeUrl);
            
            // 切换到正确的页面
            switchToPage(pageId);
            
            // 加载iframe历史URL
            const iframe = document.querySelector(`#${pageId} iframe`);
            if (iframe && iframeUrl) {
                iframe.src = iframeUrl;
            }
        }
    });
    
    // 导航栏切换
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // 更新导航栏激活状态
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // 切换页面显示
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            
            // 记录历史
            if (pageHistory[pageHistory.length - 1] !== target) {
                pageHistory.push(target);
            }
            
            // 如果切换到推送记录页面，确保子标签和iframe正确加载
            if (target === 'pushRecords') {
                // 获取当前活跃的子标签
                const activeSubTab = document.querySelector('.sub-tab.active');
                if (activeSubTab) {
                    const subTarget = activeSubTab.getAttribute('data-target');
                    const subIframe = document.querySelector(`#${subTarget} iframe`);
                    
                    // 确保iframe加载
                    if (subIframe && subIframe.getAttribute('src') === 'about:blank') {
                        subIframe.src = subIframe.getAttribute('data-src');
                        console.log('加载子标签iframe:', subTarget, subIframe.getAttribute('data-src'));
                    }
                }
            }
        });
    });
    
    // 关闭弹窗按钮
    closePopupBtn.addEventListener('click', function() {
        loginPopup.style.display = 'none';
    });
    
    // 返回按钮功能 - 使用浏览器历史API
    backButton.addEventListener('click', function() {
        console.log('===== 返回按钮被点击 =====');
        
        const currentPageId = pageHistory[pageHistory.length - 1];
        console.log('当前页面ID:', currentPageId);
        
        // 检查当前页面的iframe历史
        if (iframeHistory[currentPageId] && iframeHistory[currentPageId].length > 1) {
            // 存在历史记录，移除当前URL并返回上一个URL
            iframeHistory[currentPageId].pop(); // 移除当前URL
            const prevUrl = iframeHistory[currentPageId][iframeHistory[currentPageId].length - 1];
            
            console.log('返回到iframe历史URL:', prevUrl);
            
            // 获取当前iframe并设置URL
            const iframe = document.querySelector(`#${currentPageId} iframe`);
            if (iframe && prevUrl) {
                // 使用history.back() 触发浏览器返回
                window.history.back();
            }
        } else {
            console.log('没有iframe历史记录，使用浏览器返回');
            window.history.back();
        }
    });
    
    // 子标签切换逻辑
    subTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // 更新标签激活状态
            subTabs.forEach(subTab => subTab.classList.remove('active'));
            this.classList.add('active');
            
            // 切换子页面显示
            subPages.forEach(subPage => {
                if (subPage.id === target) {
                    subPage.classList.add('active');
                    // 确保iframe加载
                    const iframe = subPage.querySelector('iframe');
                    if (iframe && iframe.getAttribute('src') === 'about:blank') {
                        iframe.src = iframe.getAttribute('data-src');
                    }
                } else {
                    subPage.classList.remove('active');
                }
            });
        });
    });
    
    // 函数：显示登录弹窗
    function showLoginPopup() {
        loginPopup.style.display = 'flex';
    }
    
    // 函数：加载iframe内容并设置历史记录监听
    function loadIframeContentWithHistory() {
        iframes.forEach(iframe => {
            // 获取父容器ID
            let pageId;
            const parentPage = iframe.closest('.page');
            const parentSubPage = iframe.closest('.sub-page');
            
            if (parentSubPage) {
                pageId = parentSubPage.id; // 如果在子页面中，使用子页面ID
            } else if (parentPage) {
                pageId = parentPage.id; // 否则使用主页面ID
            } else {
                return; // 如果没有找到父容器，跳过
            }
            
            const src = iframe.getAttribute('data-src');
            
            if (src) {
                console.log('加载iframe:', pageId, src);
                
                // 添加初始URL到历史记录
                if (!iframeHistory[pageId]) {
                    iframeHistory[pageId] = [];
                }
                iframeHistory[pageId].push(src);
                
                // 保存初始状态到浏览器历史
                if (pageId === 'home' || pageId === 'candidateList') {
                    window.history.replaceState(
                        { pageId, iframeUrl: src },
                        document.title,
                        window.location.pathname + window.location.search
                    );
                }
                
                // 设置iframe src
                iframe.setAttribute('src', src);
                
                // 监听iframe加载事件以跟踪导航
                iframe.addEventListener('load', function() {
                    const currentUrl = this.contentWindow.location.href;
                    console.log('iframe加载完成:', pageId, currentUrl);
                    
                    // 确保不是初始加载
                    if (currentUrl !== 'about:blank' && currentUrl !== src) {
                        try {
                            // 尝试读取当前URL并添加到历史记录
                            const latestUrl = this.contentWindow.location.href;
                            
                            // 检查URL是否已经在历史记录中(避免重复)
                            if (iframeHistory[pageId][iframeHistory[pageId].length - 1] !== latestUrl) {
                                console.log('添加新URL到iframe历史:', pageId, latestUrl);
                                iframeHistory[pageId].push(latestUrl);
                                
                                // 使用浏览器历史API添加新状态
                                window.history.pushState(
                                    { pageId, iframeUrl: latestUrl },
                                    document.title,
                                    window.location.pathname + window.location.search + '#' + encodeURIComponent(latestUrl)
                                );
                            }
                        } catch (e) {
                            console.log('无法访问iframe内容:', e.message);
                            // 跨域访问失败，使用iframe的src属性
                            if (this.src !== iframeHistory[pageId][iframeHistory[pageId].length - 1]) {
                                iframeHistory[pageId].push(this.src);
                                
                                // 使用浏览器历史API添加新状态
                                window.history.pushState(
                                    { pageId, iframeUrl: this.src },
                                    document.title,
                                    window.location.pathname + window.location.search + '#' + encodeURIComponent(this.src)
                                );
                            }
                        }
                    }
                });
            }
        });
    }
    
    // 函数：切换到指定页面
    function switchToPage(pageId) {
        // 更新导航栏激活状态
        navItems.forEach(navItem => {
            if (navItem.getAttribute('data-target') === pageId) {
                navItem.classList.add('active');
            } else {
                navItem.classList.remove('active');
            }
        });
        
        // 切换页面显示
        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        // 更新历史记录
        if (pageHistory[pageHistory.length - 1] !== pageId) {
            pageHistory.push(pageId);
        }
    }
    
    // 监听来自iframe的消息
    window.addEventListener('message', function(event) {
        console.log('收到iframe消息:', event.origin, event.data);
        
        // 如果iframe发送导航消息，记录它
        if (event.data && event.data.type === 'navigation' && event.data.url) {
            const pageId = getPageIdFromOrigin(event.origin);
            if (pageId) {
                console.log('从iframe收到导航事件:', pageId, event.data.url);
                iframeHistory[pageId].push(event.data.url);
            }
        }
    });
    
    // 辅助函数：从origin获取pageId
    function getPageIdFromOrigin(origin) {
        for (const pageId in iframeHistory) {
            const iframe = document.querySelector(`#${pageId} iframe`);
            if (iframe) {
                try {
                    const iframeOrigin = new URL(iframe.src).origin;
                    if (iframeOrigin === origin) {
                        return pageId;
                    }
                } catch (e) {
                    // 忽略URL解析错误
                }
            }
        }
        return null;
    }
});
