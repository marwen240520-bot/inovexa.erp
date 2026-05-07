import { useState, useEffect, useCallback } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isMediumMobile: boolean;
  isLargeMobile: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmallMobile: false,
    isMediumMobile: false,
    isLargeMobile: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: 'landscape',
    breakpoint: 'lg'
  });

  const getBreakpoint = useCallback((width: number): ResponsiveState['breakpoint'] => {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }, []);

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const breakpoint = getBreakpoint(width);
    
    setState({
      width,
      height,
      orientation,
      breakpoint,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmallMobile: width < 375,
      isMediumMobile: width >= 375 && width < 480,
      isLargeMobile: width >= 480 && width < 768,
    });
  }, [getBreakpoint]);

  useEffect(() => {
    // Vérifier si on est dans le navigateur
    if (typeof window === 'undefined') return;
    
    handleResize();
    
    // Écouter les événements de redimensionnement
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  return state;
}

// Hook supplémentaire pour détecter si l'appareil est tactile
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        ('msMaxTouchPoints' in navigator && navigator['msMaxTouchPoints'] > 0));
    };
    
    checkTouch();
  }, []);

  return isTouch;
}

// Hook pour détecter la direction du scroll
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      
      if (direction !== scrollDirection && Math.abs(currentScrollY - lastScrollY) > 10) {
        setScrollDirection(direction);
      }
      setScrollY(currentScrollY);
      lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
    };
    
    window.addEventListener('scroll', updateScrollDirection);
    
    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, [scrollDirection]);

  return { scrollDirection, scrollY };
}

// Hook pour détecter la taille de l'écran en temps réel
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}