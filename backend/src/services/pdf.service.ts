import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IAssignmentDocument } from '../models/Assignment';
import logger from '../config/logger';

export class PDFService {
  async generateAssessmentPDF(assignment: IAssignmentDocument): Promise<Buffer> {
    logger.info(`Generating PDF for Assignment: ${assignment.title}`);
    
    // Create new PDF Document
    const pdfDoc = await PDFDocument.create();
    
    // Standard page dimensions: Letter (612 x 792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 54; // 0.75 in
    
    // Load Fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin; // Start drawing at top margin

    // Helper functions for drawing text and managing pagination
    const checkPageBreak = (heightNeeded: number) => {
      if (y - heightNeeded < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    };

    const drawLine = () => {
      checkPageBreak(15);
      page.drawLine({
        start: { x: margin, y: y },
        end: { x: pageWidth - margin, y: y },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 15;
    };

    const drawText = (
      text: string,
      fontSize: number,
      font: any,
      lineHeight = 16,
      indent = 0
    ) => {
      const maxWidth = pageWidth - (margin * 2) - indent;
      const words = text.split(' ');
      let currentLine = '';
      const lines: string[] = [];

      // Wrap text
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width < maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw each line with page-break verification
      for (const line of lines) {
        checkPageBreak(lineHeight);
        page.drawText(line, {
          x: margin + indent,
          y: y - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= lineHeight;
      }
    };

    // Header Letterhead
    drawText(`Date Generated: ${new Date().toLocaleDateString()}`, 8, fontItalic, 12);
    y -= 10;
    
    // Exam title
    drawText(assignment.title.toUpperCase(), 18, fontBold, 22);
    drawLine();

    // Student Info Form Fields
    checkPageBreak(30);
    page.drawText('Student Name: ________________________', { x: margin, y: y - 10, size: 10, font: fontRegular });
    page.drawText('Roll No: ____________', { x: margin + 250, y: y - 10, size: 10, font: fontRegular });
    page.drawText('Section: ________', { x: margin + 400, y: y - 10, size: 10, font: fontRegular });
    y -= 25;
    drawLine();

    // Stats: Marks and Difficulty
    checkPageBreak(20);
    page.drawText(`Total Marks: ${assignment.marks}`, { x: margin, y: y - 10, size: 10, font: fontBold });
    page.drawText(`Target Difficulty: ${assignment.difficulty}`, { x: margin + 150, y: y - 10, size: 10, font: fontRegular });
    page.drawText(`Questions count: ${assignment.totalQuestions}`, { x: margin + 300, y: y - 10, size: 10, font: fontRegular });
    y -= 20;
    drawLine();

    // Add Instructions
    if (assignment.instructions) {
      drawText('General Instructions:', 11, fontBold, 15);
      drawText(assignment.instructions, 10, fontItalic, 14, 10);
      y -= 10;
      drawLine();
    }

    // Question Sections
    if (assignment.generatedPaper?.sections) {
      for (const section of assignment.generatedPaper.sections) {
        y -= 10;
        // Section Title
        drawText(section.title, 13, fontBold, 18);
        // Section Instruction
        drawText(`Instruction: ${section.instruction}`, 10, fontItalic, 14, 5);
        y -= 5;

        // Section Questions
        let qIndex = 1;
        for (const q of section.questions) {
          y -= 5;
          // Format question header with indices and marks
          const questionText = `${qIndex}. ${q.text}`;
          const marksLabel = `[${q.marks} Marks]`;
          
          checkPageBreak(25);
          
          // Draw marks label right-aligned
          const labelWidth = fontItalic.widthOfTextAtSize(marksLabel, 9);
          page.drawText(marksLabel, {
            x: pageWidth - margin - labelWidth,
            y: y - 10,
            size: 9,
            font: fontItalic,
            color: rgb(0.3, 0.3, 0.3),
          });

          // Draw question text (left-aligned, with right padding to avoid overlapping the marks label)
          drawText(questionText, 10, fontRegular, 15, 10);
          
          // Draw MCQ options if present
          if (q.type === 'MCQ' && q.options && q.options.length > 0) {
            y -= 5;
            for (let i = 0; i < q.options.length; i++) {
              const optionText = `${String.fromCharCode(65 + i)}.  ${q.options[i]}`;
              drawText(optionText, 10, fontRegular, 15, 30);
            }
          }

          qIndex++;
        }
      }
    } else {
      drawText('No question content generated for this paper.', 12, fontItalic, 16);
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export const pdfService = new PDFService();
export default pdfService;
