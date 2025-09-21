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
            // Load configuration from data.json
            const response = await fetch('data.json');
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

// Initialize the counter manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const counterManager = new CounterManager();
    counterManager.init();
    
    // Make it globally accessible for debugging
    window.counterManager = counterManager;
});

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