/**
 * Common utility functions for Moonbot Office
 */

/**
 * Format number with thousands separator, auto-detect decimals, and optional prefix/suffix
 * - Thousands separator: , (comma)
 * - Decimal separator: . (dot)
 * - If decimals is not specified, auto-detect from input value
 * 
 * @param {number|string} value - The number to format
 * @param {Object} [options] - Formatting options
 * @param {number|null} [options.decimals=null] - Decimal places (null = auto-detect)
 * @param {string} [options.prefix=''] - Prefix to add (e.g. '$ ')
 * @param {string} [options.suffix=''] - Suffix to add (e.g. '%')
 * @returns {string} Formatted number string
 * 
 * Examples:
 *   formatNumber(12806)                        → "12,806"
 *   formatNumber(2700)                         → "2,700"
 *   formatNumber(7686.6565)                    → "7,686.6565"   (auto-detect)
 *   formatNumber(2700.5, { decimals: 2 })      → "2,700.50"
 *   formatNumber('$ 2700')                     → "2,700"
 *   formatNumber(2700, { prefix: '$ ' })       → "$ 2,700"
 *   formatNumber(82.5, { suffix: '%' })        → "82.5%"
 *   formatNumber('8200.5%', { suffix: '%' })   → "8,200.5%"
 */
export function formatNumber(value, options = {}) {
    const { decimals = null, prefix = '', suffix = '' } = options;

    if (value === null || value === undefined || value === '') return '-';

    // If value is string, try to extract numeric part
    let num;
    let originalStr;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.,-]/g, '').trim();
        if (cleaned === '') return value;
        originalStr = cleaned;
        num = parseFloat(cleaned);
    } else {
        num = Number(value);
        originalStr = String(value);
    }

    if (isNaN(num)) return value;

    // Custom Rounding Logic: max 1 decimal place, .5 and above round up, .4 and below round down
    // Examples: 0.17 -> 0.2, 0.13 -> 0.1, 1.0 -> 1
    // We can use Math.round(num * 10) / 10 to achieve this mathematically
    
    // First, let's round the number to 1 decimal place.
    const roundedNum = Math.round(num * 10) / 10;
    
    // Convert to string to see if it has decimals
    const roundedStr = roundedNum.toString();
    const parts = roundedStr.split('.');
    
    // Add comma as thousands separator for the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Join with dot as decimal separator
    const formatted = parts.length > 1 ? parts.join('.') : parts[0];

    return prefix + formatted + suffix;
}

/**
 * Format percentage with average days
 * Used in Pipeline columns (Activate, API Bind, Credit, Bot Run)
 * 
 * @param {number|string} percent - The percentage value
 * @param {number|string} days - The average days value
 * @param {number} percentDecimals - Decimal places for percent (default: 0)
 * @param {number} daysDecimals - Decimal places for days (default: 2)
 * @returns {string} Formatted string like "85% (3,50 d)"
 * 
 * Examples:
 *   formatPercentWithDays(85, 3.5)       → "85% (3,50 d)"
 *   formatPercentWithDays(92.5, 12.75)   → "93% (12,75 d)"
 *   formatPercentWithDays(100, 0)        → "100% (0,00 d)"
 */
export function formatPercentWithDays(percent, days, percentDecimals = 0, daysDecimals = 0) {
    if (percent === null || percent === undefined || percent === '') return '-';
    if (days === null || days === undefined || days === '') {
        return formatNumber(percent, { decimals: percentDecimals, suffix: '%' });
    }

    const pct = typeof percent === 'string' ? parseFloat(percent) : Number(percent);
    const d = typeof days === 'string' ? parseFloat(days) : Number(days);

    // If values are non-numeric (placeholder text), pass through as-is
    const pctFormatted = isNaN(pct) ? percent : formatNumber(pct, { decimals: percentDecimals });
    
    // Always round down the days as requested (e.g., 1.2 -> 1, 1.6 -> 1)
    const flooredDays = Math.floor(d);
    const daysFormatted = isNaN(flooredDays) ? days : flooredDays.toFixed(daysDecimals).replace('.', ',');

    return `${pctFormatted}% (${daysFormatted} d)`;
}

/**
 * Format rank with star emoji
 * 
 * @param {number|string} value - The rank value
 * @returns {string} Formatted string like "6 ⭐"
 * 
 * Examples:
 *   formatRank(6) → "6 ⭐"
 *   formatRank(3) → "3 ⭐"
 */
export function formatRank(value) {
    if (value === null || value === undefined || value === '') return '-';
    return `${value} ⭐`;
}

/**
 * Convert JSON array to CSV and trigger download
 * 
 * @param {Object} params - The parameters
 * @param {Array} [params.header=[]] - Optional header array. If empty, keys from first data object are used.
 * @param {Array} params.data - Array of objects to convert
 * @param {string} [params.filename='download.csv'] - The filename for the downloaded CSV
 */
export function JsonToCSV({ header = [], data = [], filename = 'download.csv' }) {
    if (!data || !data.length) {
        console.warn('No data provided to JsonToCSV');
        return;
    }

    // Determine headers
    const csvHeaders = header && header.length > 0 ? header : Object.keys(data[0]);

    // Build CSV content
    const csvRows = [];
    
    // Add header row
    // Ensure header strings are properly escaped if they contain commas
    const escapedHeaders = csvHeaders.map(hdr => {
        let val = String(hdr);
        if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
            val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    });
    csvRows.push(escapedHeaders.join(','));

    // Add data rows
    for (const row of data) {
        const values = csvHeaders.map(hdr => {
            let val = row[hdr] !== undefined && row[hdr] !== null ? row[hdr] : '';
            if (typeof val === 'object') {
                val = JSON.stringify(val);
            } else {
                val = String(val);
            }
            // Escape quotes and fields containing comma or newline
            if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Convert JSON array to PDF and trigger download
 * 
 * @param {Object} params - The parameters
 * @param {Array} [params.header=[]] - Optional header array. If empty, keys from first data object are used.
 * @param {Array} params.data - Array of objects to convert
 * @param {string} [params.filename='download.pdf'] - The filename for the downloaded PDF
 * @param {string} [params.title='Export Data'] - The title inside the PDF document
 */
export function JsonToPDF({ header = [], data = [], filename = 'download.pdf', title = 'Export Data' }) {
    if (!data || !data.length) {
        console.warn('No data provided to JsonToPDF');
        return;
    }

    if (typeof window.jspdf === 'undefined') {
        alert('jsPDF library is not loaded. Please check your internet connection or contact administrator.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Determine headers
    const tableHeaders = header && header.length > 0 ? header : Object.keys(data[0]);
    
    // Build rows
    const tableRows = data.map(row => {
        return tableHeaders.map(hdr => {
            let val = row[hdr] !== undefined && row[hdr] !== null ? row[hdr] : '';
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
        });
    });

    // Add title
    doc.setFontSize(14);
    doc.text(title, 14, 15);

    // Add table
    doc.autoTable({
        head: [tableHeaders],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [57, 222, 187] }
    });

    doc.save(filename);
}

/**
 * Get default date range string for the last 30 days
 * @returns {string} Formatted string like "YYYY-MM-DD to YYYY-MM-DD"
 */
export function getDefaultDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    return `${formatDate(start)} to ${formatDate(end)}`;
}
