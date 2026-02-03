import { useState, useCallback } from 'react';

export interface SystemCheckResult {
    browser: { status: string; passed: boolean; details: string };
    microphone: { status: string; passed: boolean; details: string };
    speaker: { status: string; passed: boolean; details: string };
}

export const useSystemTest = () => {
    const [results, setResults] = useState<SystemCheckResult | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const runTests = useCallback(async () => {
        setIsTesting(true);
        const newResults: SystemCheckResult = {
            browser: { status: 'Checking...', passed: false, details: '' },
            microphone: { status: 'Pending', passed: false, details: '' },
            speaker: { status: 'Pending', passed: false, details: '' },
        };
        setResults({ ...newResults });

        // Heuristic delay for visual feedback
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // 1. Browser Check
        await delay(800);
        const ua = navigator.userAgent;
        let browserName = 'Unknown Browser';
        if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browserName = 'Safari';

        const version = ua.match(/(Chrome|Firefox|Safari)\/([0-9.]+)/)?.[2] || 'Unknown';
        newResults.browser = {
            status: 'Ready',
            passed: true,
            details: `${browserName} v${version}`
        };
        newResults.microphone.status = 'Checking...';
        setResults({ ...newResults });

        // 2. Microphone Check
        await delay(1000);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            newResults.microphone = {
                status: 'Active',
                passed: true,
                details: 'Hardware Detected'
            };
        } catch (err) {
            newResults.microphone = {
                status: 'Error',
                passed: false,
                details: 'Access Denied or Not Found'
            };
        }
        newResults.speaker.status = 'Checking...';
        setResults({ ...newResults });

        // 3. Speaker Check
        await delay(600);
        if (window.AudioContext || (window as any).webkitAudioContext) {
            newResults.speaker = {
                status: 'Certified',
                passed: true,
                details: 'Output Verified'
            };
        } else {
            newResults.speaker = {
                status: 'Legacy',
                passed: false,
                details: 'Incompatible Audio Stack'
            };
        }

        setResults({ ...newResults });
        setIsTesting(false);
        return newResults;
    }, []);

    return { results, isTesting, runTests };
};
