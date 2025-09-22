// Page Navigation System
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show the selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update page title
    switch(pageId) {
        case 'home':
            document.title = 'Australian Men';
            break;
        case 'sources':
            document.title = 'Sources - Australian Men';
            break;
        case 'about':
            document.title = 'About - Australian Men';
            break;
    }
}

// Initialize page system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Move the main counter content to the home page container
    const homePageContainer = document.getElementById('home-page');
    const title = document.querySelector('.title');
    const sections = document.querySelectorAll('.section');
    const footerTexts = document.querySelectorAll('.footer-text, .footer-text-small');
    
    // Move all main content to home page
    if (homePageContainer) {
        homePageContainer.appendChild(title);
        sections.forEach(section => homePageContainer.appendChild(section));
        footerTexts.forEach(footer => homePageContainer.appendChild(footer));
    }
    
    // Initialize counter manager
    const counterManager = new CounterManager();
    counterManager.init();
    
    // Make it globally accessible for debugging
    window.counterManager = counterManager;
    
    // Make showPage globally accessible
    window.showPage = showPage;
    
    // Start on home page
    showPage('home');
});

// Counter Management System with Animation
class CounterManager {
    constructor() {
        this.config = null;
        this.updateInterval = null;
        this.currentCounts = {
            suicides: 0,
            earlyDeaths: 0
        };
        this.animationDuration = 800; // Animation duration in ms
    }

    async init() {
        try {
            // Load configuration from data.json with cache busting
            const cacheBuster = new Date().getTime();
            const response = await fetch(`data.json?v=${cacheBuster}`);
            this.config = await response.json();
            
            // Initialize current counts
            this.currentCounts.suicides = this.calculateCurrentCount(this.config.suicides);
            this.currentCounts.earlyDeaths = this.calculateCurrentCount(this.config['early-deaths']);
            
            // Set initial display without animation
            this.updateCounterDisplay('.section:not(.early-deaths) .counters', this.currentCounts.suicides, false);
            this.updateCounterDisplay('.section.early-deaths .counters', this.currentCounts.earlyDeaths, false);
            
            // Start the counter updates
            this.updateInterval = setInterval(() => {
                this.checkAndUpdateCounters();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to load configuration:', error);
        }
    }

    calculateCurrentCount(categoryConfig) {
        const startTime = new Date(categoryConfig['start-datetime']);
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const incrementsOccurred = Math.floor(elapsedSeconds / categoryConfig['increment-seconds']);
        
        return categoryConfig['start-count'] + incrementsOccurred;
    }

    checkAndUpdateCounters() {
        if (!this.config) return;

        // Calculate new counts
        const newSuicidesCount = this.calculateCurrentCount(this.config.suicides);
        const newEarlyDeathsCount = this.calculateCurrentCount(this.config['early-deaths']);

        // Update suicides counter if changed
        if (newSuicidesCount !== this.currentCounts.suicides) {
            this.animateCounterChange('.section:not(.early-deaths) .counters', this.currentCounts.suicides, newSuicidesCount);
            this.currentCounts.suicides = newSuicidesCount;
        }

        // Update early deaths counter if changed
        if (newEarlyDeathsCount !== this.currentCounts.earlyDeaths) {
            this.animateCounterChange('.section.early-deaths .counters', this.currentCounts.earlyDeaths, newEarlyDeathsCount);
            this.currentCounts.earlyDeaths = newEarlyDeathsCount;
        }
    }

    animateCounterChange(containerId, fromCount, toCount) {
        const container = document.querySelector(containerId);
        if (!container) return;

        const counterElements = container.querySelectorAll('.counter');
        const fromString = this.formatNumber(fromCount);
        const toString = this.formatNumber(toCount);

        // Animate each digit that changed
        counterElements.forEach((element, index) => {
            const fromDigit = parseInt(fromString[fromString.length - counterElements.length + index] || '0');
            const toDigit = parseInt(toString[toString.length - counterElements.length + index] || '0');
            
            if (fromDigit !== toDigit) {
                this.animateDigit(element, fromDigit, toDigit);
            }
        });
    }

    animateDigit(element, fromDigit, toDigit) {
        // Add animation class
        element.classList.add('animating');
        
        let startTime = null;
        const duration = this.animationDuration;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Calculate current digit value
            const currentValue = fromDigit + (toDigit - fromDigit) * easeProgress;
            const displayDigit = Math.floor(currentValue);
            
            element.textContent = displayDigit;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = toDigit;
                element.classList.remove('animating');
            }
        };
        
        requestAnimationFrame(animate);
    }

    formatNumber(number) {
        // Convert number to string and pad with leading zeros if needed
        return number.toString().padStart(6, '0');
    }

    updateCounterDisplay(containerId, count, animate = true) {
        const container = document.querySelector(containerId);
        if (!container) return;

        const formattedCount = this.formatNumber(count);
        const counterElements = container.querySelectorAll('.counter');
        
        // Update each digit
        for (let i = 0; i < counterElements.length && i < formattedCount.length; i++) {
            const digit = formattedCount[formattedCount.length - counterElements.length + i];
            counterElements[i].textContent = digit || '0';
        }
    }

    // Method to stop the counter updates
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Handle page visibility changes to pause/resume when tab is not active
document.addEventListener('visibilitychange', () => {
    if (window.counterManager) {
        if (document.hidden) {
            window.counterManager.stop();
        } else {
            window.counterManager.init();
        }
    }
});