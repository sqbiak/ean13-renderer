/**
 * EAN-13 Barcode Renderer
 *
 * A lightweight, professional-quality EAN-13 barcode generator
 * with proper GS1-compliant digit placement.
 * Now with ISBN mode support for book barcodes.
 *
 * @version 1.2.0
 * @license Proprietary
 * @author ZenBlock
 * @copyright (c) 2024 ZenBlock. All Rights Reserved.
 *
 * PROPRIETARY LICENSE
 *
 * Copyright (c) 2024 ZenBlock. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * modification, distribution, or use of this software, via any medium,
 * is strictly prohibited without express written permission from ZenBlock.
 *
 * PERMITTED USE:
 * - Personal, non-commercial use is permitted free of charge
 * - Educational and evaluation purposes
 *
 * PROHIBITED WITHOUT LICENSE:
 * - Commercial use of any kind
 * - Redistribution or resale
 * - Modification for commercial purposes
 * - Inclusion in commercial products or services
 *
 * For commercial licensing inquiries, contact: sebastian.qbiak+license@gmail.com
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

(function (global, factory) {
    // UMD (Universal Module Definition)
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.EAN13Renderer = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    // EAN-13 encoding tables
    const L_CODES = [
        '0001101', '0011001', '0010011', '0111101', '0100011',
        '0110001', '0101111', '0111011', '0110111', '0001011'
    ];
    const G_CODES = [
        '0100111', '0110011', '0011011', '0100001', '0011101',
        '0111001', '0000101', '0010001', '0001001', '0010111'
    ];
    const R_CODES = [
        '1110010', '1100110', '1101100', '1000010', '1011100',
        '1001110', '1010000', '1000100', '1001000', '1110100'
    ];
    const STRUCTURE = [
        'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
        'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
    ];

    const SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * Calculate EAN-13 check digit
     * @param {string} code12 - 12-digit code
     * @returns {number} Check digit (0-9)
     */
    function calculateChecksum(code12) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(code12[i]) * (i % 2 === 0 ? 1 : 3);
        }
        return (10 - (sum % 10)) % 10;
    }

    /**
     * Validate EAN-13 code
     * @param {string} code - 12 or 13 digit code
     * @returns {boolean} True if valid
     */
    function validate(code) {
        code = String(code).replace(/\D/g, '');
        if (code.length === 12) return true;
        if (code.length === 13) {
            return parseInt(code[12]) === calculateChecksum(code.substring(0, 12));
        }
        return false;
    }

    /**
     * Format ISBN-13 with hyphens
     * Uses simplified hyphenation (978-X-XX-XXXXXX-X)
     * @param {string} code13 - 13-digit ISBN
     * @returns {string} Hyphenated ISBN
     */
    function formatISBN(code13) {
        // Standard simplified ISBN-13 format: 978-X-XX-XXXXXX-X
        return code13.slice(0, 3) + '-' +
            code13.slice(3, 4) + '-' +
            code13.slice(4, 6) + '-' +
            code13.slice(6, 12) + '-' +
            code13.slice(12);
    }

    /**
     * Encode EAN-13 to binary string
     * @param {string} code - 12 or 13 digit code
     * @returns {object} { encoding: string, fullCode: string }
     */
    function encode(code) {
        code = String(code).replace(/\D/g, '');

        if (code.length === 12) {
            code = code + calculateChecksum(code);
        }

        if (code.length !== 13) {
            throw new Error('EAN-13 requires 12 or 13 digits');
        }

        const firstDigit = parseInt(code[0]);
        const structure = STRUCTURE[firstDigit];

        let encoding = '101'; // Start guard

        // Left side (digits 1-6)
        for (let i = 0; i < 6; i++) {
            const digit = parseInt(code[i + 1]);
            encoding += structure[i] === 'L' ? L_CODES[digit] : G_CODES[digit];
        }

        encoding += '01010'; // Center guard

        // Right side (digits 7-12)
        for (let i = 0; i < 6; i++) {
            const digit = parseInt(code[i + 7]);
            encoding += R_CODES[digit];
        }

        encoding += '101'; // End guard

        return { encoding, fullCode: code };
    }

    /**
     * Default options
     */
    const DEFAULTS = {
        moduleWidth: 2,      // Width of single bar module in pixels
        height: 70,          // Main bar height in pixels
        guardExtend: 10,     // How much guard bars extend below main bars
        fontSize: 14,        // Font size for digits
        textMargin: 2,       // Gap between bars and text
        quietZone: 12,       // Quiet zone width (space for first digit)
        sideDigitGap: 2,     // Gap between side digit and guard bars
        paddingLeft: 0,      // Extra padding on left side
        paddingRight: 0,     // Extra padding on right side
        paddingTop: 0,       // Extra padding on top
        paddingBottom: 0,    // Extra padding on bottom
        background: '#FFFFFF',
        foreground: '#000000',
        font: '"OCR-B", "Courier New", monospace',
        // ISBN mode options
        isbnMode: false,     // When true, renders "ISBN" prefix above barcode
        isbnFontSize: 10     // Font size for ISBN prefix text
    };

    /**
     * Render EAN-13 barcode to canvas
     * @param {HTMLCanvasElement|string} canvas - Canvas element or selector
     * @param {string} code - 12 or 13 digit EAN code
     * @param {object} options - Rendering options
     * @returns {HTMLCanvasElement} The canvas element
     */
    function render(canvas, code, options = {}) {
        // Get canvas element
        if (typeof canvas === 'string') {
            canvas = document.querySelector(canvas);
        }
        if (!canvas || !canvas.getContext) {
            throw new Error('Invalid canvas element');
        }

        // Merge options with defaults
        const opts = { ...DEFAULTS, ...options };
        const {
            moduleWidth, height, guardExtend, fontSize,
            textMargin, quietZone, sideDigitGap,
            paddingLeft, paddingRight, paddingTop, paddingBottom,
            background, foreground, font,
            isbnMode, isbnFontSize
        } = opts;

        // Encode the barcode
        const { encoding, fullCode } = encode(code);

        // Calculate dimensions
        const barcodeWidth = encoding.length * moduleWidth;
        const guardHeight = height + guardExtend;
        const contentWidth = barcodeWidth + quietZone * 2;

        // Add space for ISBN prefix if enabled
        const isbnPrefixHeight = isbnMode ? (isbnFontSize + 4) : 0;
        const contentHeight = guardHeight + fontSize + textMargin + isbnPrefixHeight;
        const totalWidth = contentWidth + paddingLeft + paddingRight;
        const totalHeight = contentHeight + paddingTop + paddingBottom;

        // Set canvas size
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Offset for padding (and ISBN prefix space)
        const offsetX = paddingLeft;
        const offsetY = paddingTop + isbnPrefixHeight;

        // Draw ISBN prefix if enabled
        if (isbnMode) {
            ctx.fillStyle = foreground;
            ctx.font = `${isbnFontSize}px ${font}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const isbnText = 'ISBN ' + formatISBN(fullCode);
            ctx.fillText(isbnText, offsetX + quietZone, paddingTop);
        }

        // Draw bars
        ctx.fillStyle = foreground;
        let x = offsetX + quietZone;

        for (let i = 0; i < encoding.length; i++) {
            // Guards: start (0-2), center (45-49), end (92-94)
            const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92);
            const barHeight = isGuard ? guardHeight : height;

            if (encoding[i] === '1') {
                ctx.fillRect(x, offsetY, moduleWidth, barHeight);
            }
            x += moduleWidth;
        }

        // Draw text - all digits on same baseline
        ctx.fillStyle = foreground;
        ctx.font = `${fontSize}px ${font}`;
        ctx.textBaseline = 'top';
        const textY = offsetY + height + textMargin;

        // First digit - in quiet zone
        ctx.textAlign = 'right';
        ctx.fillText(fullCode[0], offsetX + quietZone - sideDigitGap, textY);

        // Left group (digits 1-6)
        ctx.textAlign = 'center';
        const leftStart = offsetX + quietZone + 3 * moduleWidth;
        for (let i = 0; i < 6; i++) {
            const digitX = leftStart + (i + 0.5) * 7 * moduleWidth;
            ctx.fillText(fullCode[i + 1], digitX, textY);
        }

        // Right group (digits 7-12)
        const rightStart = offsetX + quietZone + 50 * moduleWidth;
        for (let i = 0; i < 6; i++) {
            const digitX = rightStart + (i + 0.5) * 7 * moduleWidth;
            ctx.fillText(fullCode[i + 7], digitX, textY);
        }

        return canvas;
    }

    /**
     * Render to new canvas and return as data URL
     * @param {string} code - 12 or 13 digit EAN code
     * @param {object} options - Rendering options
     * @returns {string} Data URL (PNG)
     */
    function toDataURL(code, options = {}) {
        const canvas = document.createElement('canvas');
        render(canvas, code, options);
        return canvas.toDataURL('image/png');
    }

    /**
     * Render to new canvas and return as Blob
     * @param {string} code - 12 or 13 digit EAN code
     * @param {object} options - Rendering options
     * @returns {Promise<Blob>} PNG Blob
     */
    function toBlob(code, options = {}) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            render(canvas, code, options);
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
            }, 'image/png');
        });
    }

    /**
     * Render EAN-13 barcode to SVG element
     * @param {SVGElement|string} svg - SVG element or selector
     * @param {string} code - 12 or 13 digit EAN code
     * @param {object} options - Rendering options
     * @returns {SVGElement} The SVG element
     */
    function renderSVG(svg, code, options = {}) {
        if (typeof svg === 'string') {
            svg = document.querySelector(svg);
        }
        if (!svg) {
            throw new Error('Invalid SVG element');
        }

        const opts = { ...DEFAULTS, ...options };
        const {
            moduleWidth, height, guardExtend, fontSize,
            textMargin, quietZone, sideDigitGap,
            paddingLeft, paddingRight, paddingTop, paddingBottom,
            background, foreground, font,
            isbnMode, isbnFontSize
        } = opts;

        const { encoding, fullCode } = encode(code);

        const barcodeWidth = encoding.length * moduleWidth;
        const guardHeight = height + guardExtend;
        const contentWidth = barcodeWidth + quietZone * 2;

        // Add space for ISBN prefix if enabled
        const isbnPrefixHeight = isbnMode ? (isbnFontSize + 4) : 0;
        const contentHeight = guardHeight + fontSize + textMargin + isbnPrefixHeight;
        const totalWidth = contentWidth + paddingLeft + paddingRight;
        const totalHeight = contentHeight + paddingTop + paddingBottom;

        svg.innerHTML = '';
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('width', totalWidth);
        svg.setAttribute('height', totalHeight);
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

        // Background
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('width', totalWidth);
        bgRect.setAttribute('height', totalHeight);
        bgRect.setAttribute('fill', background);
        svg.appendChild(bgRect);

        const offsetX = paddingLeft;
        const offsetY = paddingTop + isbnPrefixHeight;

        // ISBN prefix if enabled
        if (isbnMode) {
            const isbnText = document.createElementNS(SVG_NS, 'text');
            isbnText.setAttribute('x', offsetX + quietZone);
            isbnText.setAttribute('y', paddingTop + isbnFontSize);
            isbnText.setAttribute('text-anchor', 'start');
            isbnText.setAttribute('font-family', font);
            isbnText.setAttribute('font-size', isbnFontSize);
            isbnText.setAttribute('fill', foreground);
            isbnText.textContent = 'ISBN ' + formatISBN(fullCode);
            svg.appendChild(isbnText);
        }

        // Bars
        let x = offsetX + quietZone;
        for (let i = 0; i < encoding.length; i++) {
            const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92);
            const barHeight = isGuard ? guardHeight : height;

            if (encoding[i] === '1') {
                const bar = document.createElementNS(SVG_NS, 'rect');
                bar.setAttribute('x', x);
                bar.setAttribute('y', offsetY);
                bar.setAttribute('width', moduleWidth);
                bar.setAttribute('height', barHeight);
                bar.setAttribute('fill', foreground);
                svg.appendChild(bar);
            }
            x += moduleWidth;
        }

        // Text
        const textY = offsetY + height + textMargin + fontSize;

        // First digit
        const firstDigit = document.createElementNS(SVG_NS, 'text');
        firstDigit.setAttribute('x', offsetX + quietZone - sideDigitGap);
        firstDigit.setAttribute('y', textY);
        firstDigit.setAttribute('text-anchor', 'end');
        firstDigit.setAttribute('font-family', font);
        firstDigit.setAttribute('font-size', fontSize);
        firstDigit.setAttribute('fill', foreground);
        firstDigit.textContent = fullCode[0];
        svg.appendChild(firstDigit);

        // Left group
        const leftStart = offsetX + quietZone + 3 * moduleWidth;
        for (let i = 0; i < 6; i++) {
            const digitX = leftStart + (i + 0.5) * 7 * moduleWidth;
            const digit = document.createElementNS(SVG_NS, 'text');
            digit.setAttribute('x', digitX);
            digit.setAttribute('y', textY);
            digit.setAttribute('text-anchor', 'middle');
            digit.setAttribute('font-family', font);
            digit.setAttribute('font-size', fontSize);
            digit.setAttribute('fill', foreground);
            digit.textContent = fullCode[i + 1];
            svg.appendChild(digit);
        }

        // Right group
        const rightStart = offsetX + quietZone + 50 * moduleWidth;
        for (let i = 0; i < 6; i++) {
            const digitX = rightStart + (i + 0.5) * 7 * moduleWidth;
            const digit = document.createElementNS(SVG_NS, 'text');
            digit.setAttribute('x', digitX);
            digit.setAttribute('y', textY);
            digit.setAttribute('text-anchor', 'middle');
            digit.setAttribute('font-family', font);
            digit.setAttribute('font-size', fontSize);
            digit.setAttribute('fill', foreground);
            digit.textContent = fullCode[i + 7];
            svg.appendChild(digit);
        }

        return svg;
    }

    /**
     * Render to new SVG and return as string
     * @param {string} code - 12 or 13 digit EAN code
     * @param {object} options - Rendering options
     * @returns {string} SVG string
     */
    function toSVG(code, options = {}) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        renderSVG(svg, code, options);
        return new XMLSerializer().serializeToString(svg);
    }

    // Public API
    return {
        render,
        renderSVG,
        toDataURL,
        toBlob,
        toSVG,
        encode,
        validate,
        calculateChecksum,
        formatISBN,
        version: '1.2.0',
        DEFAULTS
    };

}));
