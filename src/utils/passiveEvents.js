// Fix for passive event listeners warning
if (typeof window !== 'undefined') {
    // Store original addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // Override addEventListener to make scroll/touch events passive by default
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel'];
        
        if (passiveEvents.includes(type)) {
            if (typeof options === 'boolean') {
                options = { capture: options, passive: true };
            } else if (typeof options === 'object' && options !== null) {
                options = { ...options, passive: true };
            } else {
                options = { passive: true };
            }
        }
        
        return originalAddEventListener.call(this, type, listener, options);
    };
}

export {};