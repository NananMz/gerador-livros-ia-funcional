import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Exportar para PDF
export async function exportToPDF(book: any, elementId: string = 'book-content') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento não encontrado para exportação');
    }

    // Criar canvas do conteúdo
    const canvas = await html2canvas(element, {
      scale: 2, // Melhor qualidade
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Criar PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Adicionar capa
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text(book.content.title, pdfWidth / 2, 80, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Gerado por Gerador de Livros IA', pdfWidth / 2, 100, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString('pt-BR'), pdfWidth / 2, 115, { align: 'center' });

    pdf.addPage();

    // Adicionar sinopse
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Sinopse', 20, 30);
    
    pdf.setFontSize(12);
    const synopsisLines = pdf.splitTextToSize(book.content.synopsis, pdfWidth - 40);
    pdf.text(synopsisLines, 20, 45);

    // Adicionar capítulos
    let yPosition = 80;
    
    book.content.chapters.forEach((chapter: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(chapter.title, 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      const chapterLines = pdf.splitTextToSize(chapter.content, pdfWidth - 40);
      pdf.text(chapterLines, 20, yPosition);
      
      yPosition += (chapterLines.length * 6) + 20;
    });

    // Baixar PDF
    pdf.save(`${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Erro ao gerar PDF');
  }
}

// Exportar para DOCX (simulação - texto formatado)
export async function exportToDOCX(book: any) {
  try {
    // Criar conteúdo formatado para DOCX
    let docContent = `
Título: ${book.content.title}
Data: ${new Date().toLocaleDateString('pt-BR')}
Gerado por: Gerador de Livros IA

${'='.repeat(50)}

SINOPSE

${book.content.synopsis}

${'='.repeat(50)}

CAPÍTULOS

`;
    
    // Adicionar capítulos
    book.content.chapters.forEach((chapter: any, index: number) => {
      docContent += `\nCAPÍTULO ${index + 1}: ${chapter.title}\n\n`;
      docContent += `${chapter.content}\n\n`;
      docContent += `${'-'.repeat(50)}\n`;
    });

    // Criar blob e baixar
    const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar DOCX:', error);
    throw new Error('Erro ao gerar DOCX');
  }
}

// Exportar para TXT (alternativa simples)
export async function exportToTXT(book: any) {
  try {
    let txtContent = `Título: ${book.content.title}\n`;
    txtContent += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    txtContent += `Gerado por: Gerador de Livros IA\n\n`;
    txtContent += `SINOPSE\n\n${book.content.synopsis}\n\n`;
    txtContent += `CAPÍTULOS\n\n`;
    
    book.content.chapters.forEach((chapter: any, index: number) => {
      txtContent += `CAPÍTULO ${index + 1}: ${chapter.title}\n\n`;
      txtContent += `${chapter.content}\n\n`;
      txtContent += `---\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar TXT:', error);
    throw new Error('Erro ao gerar TXT');
  }
}
