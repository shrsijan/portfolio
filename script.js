// ===================================
// DOM Ready
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initWelcomeScreen();
    initClock();
    initDesktopIcons();
    initWindowSystem();
    initDock();
    initPowerMenu();
});

// ===================================
// Welcome Screen
// ===================================
function initWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const desktop = document.getElementById('desktop');

    if (!welcomeScreen || !desktop) return;

    welcomeScreen.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        setTimeout(() => {
            desktop.classList.add('visible');
            updateDockIndicator('about', true);
        }, 400);
    });
}

// ===================================
// Clock
// ===================================
function initClock() {
    updatePanelTime();
    setInterval(updatePanelTime, 1000);
}

function updatePanelTime() {
    const timeEl = document.getElementById('panel-time');
    if (timeEl) {
        const now = new Date();
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        timeEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ===================================
// Desktop Icons
// ===================================
function initDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');

    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            icons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });

        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            const link = icon.dataset.link;

            if (link) {
                window.open(link, '_blank');
            } else if (windowId) {
                openWindow(windowId);
            }
        });
    });

    const desktopArea = document.getElementById('desktop-area');
    if (desktopArea) {
        desktopArea.addEventListener('click', (e) => {
            if (e.target.id === 'desktop-area' || e.target.classList.contains('windows-container')) {
                icons.forEach(i => i.classList.remove('selected'));
            }
        });
    }
}

// ===================================
// Window System
// ===================================
let windowZIndex = 10;
let activeWindow = null;
let windowPositions = {};

function initWindowSystem() {
    const windows = document.querySelectorAll('.window');

    windows.forEach((win, index) => {
        const windowId = win.dataset.window;

        if (!win.style.left) {
            const offset = index * 30;
            win.style.left = (150 + offset) + 'px';
            win.style.top = (50 + offset) + 'px';
        }

        windowPositions[windowId] = {
            left: parseInt(win.style.left) || 150,
            top: parseInt(win.style.top) || 50,
            width: win.offsetWidth,
            height: win.offsetHeight
        };

        const header = win.querySelector('.window-header');
        initDragging(win, header);

        const controls = win.querySelectorAll('.window-btn');
        controls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleWindowAction(windowId, btn.dataset.action);
            });
        });

        win.addEventListener('mousedown', () => {
            focusWindow(windowId);
        });
    });
}

function openWindow(windowId) {
    const win = document.getElementById('window-' + windowId);
    if (!win) return;

    if (win.classList.contains('minimized')) {
        win.classList.remove('minimized');
    }

    if (!win.classList.contains('open')) {
        win.classList.add('open');
        updateDockIndicator(windowId, true);
    }

    focusWindow(windowId);

    if (windowId === 'skills') {
        animateSkillBars();
    }
}

function closeWindow(windowId) {
    const win = document.getElementById('window-' + windowId);
    if (!win) return;

    win.classList.add('closing');
    setTimeout(() => {
        win.classList.remove('open', 'closing', 'maximized');
        updateDockIndicator(windowId, false);
    }, 200);
}

function minimizeWindow(windowId) {
    const win = document.getElementById('window-' + windowId);
    if (win) win.classList.add('minimized');
}

function maximizeWindow(windowId) {
    const win = document.getElementById('window-' + windowId);
    if (!win) return;

    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        const pos = windowPositions[windowId];
        if (pos) {
            win.style.left = pos.left + 'px';
            win.style.top = pos.top + 'px';
            win.style.width = pos.width + 'px';
            win.style.height = pos.height + 'px';
        }
    } else {
        windowPositions[windowId] = {
            left: parseInt(win.style.left),
            top: parseInt(win.style.top),
            width: win.offsetWidth,
            height: win.offsetHeight
        };
        win.classList.add('maximized');
    }
}

function handleWindowAction(windowId, action) {
    switch (action) {
        case 'close': closeWindow(windowId); break;
        case 'minimize': minimizeWindow(windowId); break;
        case 'maximize': maximizeWindow(windowId); break;
    }
}

function focusWindow(windowId) {
    const win = document.getElementById('window-' + windowId);
    if (!win) return;
    windowZIndex++;
    win.style.zIndex = windowZIndex;
    activeWindow = windowId;
}

// ===================================
// Window Dragging
// ===================================
function initDragging(win, handle) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('window-btn')) return;
        if (win.classList.contains('maximized')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(win.style.left) || 0;
        startTop = parseInt(win.style.top) || 0;
        document.body.style.cursor = 'move';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        win.style.left = (startLeft + e.clientX - startX) + 'px';
        win.style.top = Math.max(0, startTop + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = 'default';
            const windowId = win.dataset.window;
            windowPositions[windowId] = {
                ...windowPositions[windowId],
                left: parseInt(win.style.left),
                top: parseInt(win.style.top)
            };
        }
    });
}

// ===================================
// Dock
// ===================================
function initDock() {
    const dockItems = document.querySelectorAll('.dock-item');

    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const windowId = item.dataset.window;
            if (!windowId) return;

            const win = document.getElementById('window-' + windowId);
            if (!win) return;

            if (win.classList.contains('open') && !win.classList.contains('minimized')) {
                if (activeWindow === windowId) {
                    minimizeWindow(windowId);
                } else {
                    focusWindow(windowId);
                }
            } else {
                openWindow(windowId);
            }
        });
    });
}

function updateDockIndicator(windowId, isOpen) {
    const dockItem = document.querySelector('.dock-item[data-window="' + windowId + '"]');
    if (dockItem) {
        dockItem.classList.toggle('active', isOpen);
    }
}

// ===================================
// Power Menu
// ===================================
function initPowerMenu() {
    const powerBtn = document.getElementById('power-btn');
    const powerMenu = document.getElementById('power-menu');
    const lockBtn = document.getElementById('lock-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (!powerBtn || !powerMenu) return;

    powerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        powerMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        powerMenu.classList.remove('open');
    });

    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            const welcomeScreen = document.getElementById('welcome-screen');
            const desktop = document.getElementById('desktop');

            desktop.classList.remove('visible');
            setTimeout(() => {
                welcomeScreen.classList.remove('hidden');
            }, 300);
            powerMenu.classList.remove('open');
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

// ===================================
// Skill Bars Animation
// ===================================
function animateSkillBars() {
    const skillBars = document.querySelectorAll('#window-skills .skill-bar');
    skillBars.forEach(bar => {
        const level = bar.style.getPropertyValue('--level');
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = level;
        }, 100);
    });
}

// ===================================
// Activities Button
// ===================================
const activitiesBtn = document.getElementById('activities-btn');
if (activitiesBtn) {
    activitiesBtn.addEventListener('click', () => {
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            if (!win.classList.contains('open')) {
                win.classList.add('open');
                updateDockIndicator(win.dataset.window, true);
            }
        });
    });
}

// ===================================
// Console Easter Egg
// ===================================
console.log('%c🚀 Sijan Shrestha Portfolio',
    'color: #E95420; font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #2C001E, #5D4E84); padding: 10px 20px; border-radius: 8px;');
console.log('%cBuilt with ❤️ using vanilla JS and Three.js',
    'color: #AEA79F; font-size: 12px;');
