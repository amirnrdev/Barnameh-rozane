import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  themeMode?: 'light' | 'dark' | 'current';
  format?: 'pdf' | 'png';
  slotCount?: number;
  slotDurationMinutes?: number;
}

/**
 * Exports the timetable element to PDF or PNG image.
 * Uses html2canvas to render full RTL Persian text and styles,
 * then packages into an A4 Landscape jsPDF document.
 */
export async function exportTimetable(
  elementId: string = 'schedule-table-printable',
  options: ExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`المان جدول با شناسه ${elementId} یافت نشد.`);
    }

    // Save scroll position
    const originalScrollLeft = element.scrollLeft;

    const isDark = options.themeMode === 'dark' 
      ? true 
      : options.themeMode === 'light' 
      ? false 
      : document.documentElement.classList.contains('dark');

    const bgColor = isDark ? '#14161f' : '#ffffff';

    // Use html2canvas with optimal settings for high-resolution Persian rendering
    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp print quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: bgColor,
      windowWidth: 1400, // Ensure desktop width is captured without mobile responsive wrapping
      onclone: (clonedDoc) => {
        if (isDark) {
          clonedDoc.documentElement.classList.add('dark');
        } else {
          clonedDoc.documentElement.classList.remove('dark');
        }

        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          // Ensure table isn't horizontally clipped in cloned view
          clonedEl.style.overflow = 'visible';
          clonedEl.style.width = 'max-content';
          clonedEl.style.minWidth = '1120px';

          // Hide interactive hover buttons or drag handles from the printout
          const hoverButtons = clonedEl.querySelectorAll('button[title*="تغییر"], button[title*="حذف"]');
          hoverButtons.forEach((btn) => ((btn as HTMLElement).style.display = 'none'));
        }
      },
    });

    // Restore scroll position
    element.scrollLeft = originalScrollLeft;

    const imgData = canvas.toDataURL('image/png', 1.0);

    if (options.format === 'png') {
      const link = document.createElement('a');
      link.download = 'برنامه_هفتگی_کنکور.png';
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    // Default: jsPDF A4 Landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
    const margin = 10; // 10mm margins

    const availWidth = pdfWidth - margin * 2;
    const availHeight = pdfHeight - margin * 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate aspect ratio fit
    const widthRatio = availWidth / canvasWidth;
    const heightRatio = availHeight / canvasHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    const finalWidth = canvasWidth * ratio;
    const finalHeight = canvasHeight * ratio;

    // Center horizontally and vertically
    const posX = margin + (availWidth - finalWidth) / 2;
    const posY = margin + (availHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');
    pdf.save('برنامه_هفتگی_کنکور.pdf');

    return { success: true };
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    return { success: false, error: err?.message || 'خطا در تولید فایل PDF' };
  }
}
