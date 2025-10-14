import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Função para gerar HTML otimizado para PDF
function generateBookHTML(book: any): string {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const totalChapters = book.content.chapters.length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.8;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #fff;
        }
        
        .cover {
          text-align: center;
          padding: 80px 20px;
          border-bottom: 3px double #2c5aa0;
          margin-bottom: 40px;
        }
        
        .cover h1 {
          font-size: 2.5em;
          color: #2c5aa0;
          margin-bottom: 20px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        .cover .subtitle {
          font-size: 1.2em;
          color: #666;
          font-style: italic;
          margin-bottom: 30px;
        }
        
        .cover .meta {
          font-size: 0.9em;
          color: #888;
          margin-top: 40px;
        }
        
        .synopsis {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          border-left: 4px solid #2c5aa0;
          margin: 40px 0;
        }
        
        .synopsis h2 {
          color: #2c5aa0;
          margin-bottom: 15px;
          font-size: 1.5em;
        }
        
        .chapter {
          margin: 50px 0;
          page-break-inside: avoid;
        }
        
        .chapter h2 {
          color: #2c5aa0;
          border-bottom: 2px solid #2c5aa0;
          padding-bottom: 10px;
          margin-bottom: 25px;
          font-size: 1.4em;
        }
        
        .chapter-content {
          text-align: justify;
          font-size: 1.1em;
        }
        
        .chapter-content p {
          margin-bottom: 1.2em;
          text-indent: 2em;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
        
        @media print {
          body { padding: 20px; }
          .cover { padding: 60px 20px; }
        }
      </style>
    </head>
    <body>
      <!-- Capa -->
      <div class="cover">
        <h1>${book.content.title}</h1>
        <div class="subtitle">Uma história gerada por inteligência artificial</div>
        <div class="meta">
          <div>Gênero: ${book.config.genre}</div>
          <div>Público: ${book.config.audience}</div>
          <div>Data: ${currentDate}</div>
          <div>Capítulos: ${totalChapters}</div>
        </div>
      </div>
      
      <!-- Sinopse -->
      <div class="synopsis">
        <h2>📖 Sinopse</h2>
        <div class="chapter-content">
          ${book.content.synopsis.split('\n').map(paragraph => 
            `<p>${paragraph.trim()}</p>`
          ).join('')}
        </div>
      </div>
      
      <!-- Descrição Original -->
      <div class="synopsis" style="background: #fff3cd; border-left-color: #ffc107;">
        <h2>🎯 Descrição Original</h2>
        <p><em>"${book.description}"</em></p>
      </div>
      
      <!-- Capítulos -->
      <div style="text-align: center; margin: 40px 0;">
        <h2 style="color: #2c5aa0; border: none;">📚 Capítulos</h2>
      </div>
      
      ${book.content.chapters.map((chapter: any, index: number) => `
        <div class="chapter">
          <h2>${chapter.title}</h2>
          <div class="chapter-content">
            ${chapter.content.split('\n\n').map(paragraph => 
              paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).join('')}
          </div>
        </div>
      `).join('')}
      
      <!-- Rodapé -->
      <div class="footer">
        <p>
          <strong>Gerado por Gerador de Livros IA</strong><br>
          ${typeof window !== 'undefined' ? window.location.hostname : 'gerador-livros-ia'} • ${currentDate}
        </p>
        <p style="font-size: 0.8em; margin-top: 10px;">
          Este livro foi gerado automaticamente por inteligência artificial.<br>
          O conteúdo é único e original, criado com base na descrição fornecida.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Exportar para PDF
export async function exportToPDF(book: any): Promise<boolean> {
  try {
    console.log('📄 Iniciando exportação PDF...');
    
    // Criar elemento temporário para o HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.innerHTML = generateBookHTML(book);
    document.body.appendChild(tempDiv);

    // Configurar opções do html2canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: 800
    });

    // Remover elemento temporário
    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Criar PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Adicionar imagem ao PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
    
    // Baixar PDF
    const fileName = `${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ PDF exportado com sucesso:', fileName);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    
    // Fallback: tentar método simples
    try {
      console.log('🔄 Tentando método alternativo...');
      await exportToPDFSimple(book);
      return true;
    } catch (fallbackError) {
      console.error('❌ Método alternativo também falhou:', fallbackError);
      throw new Error('Não foi possível gerar o PDF. Tente exportar em DOCX ou TXT.');
    }
  }
}

// Método simples alternativo para PDF (sem numeração de páginas)
async function exportToPDFSimple(book: any): Promise<boolean> {
  const pdf = new jsPDF();
  
  // Configurações básicas
  pdf.setFont('helvetica');
  pdf.setFontSize(16);
  
  // Título
  pdf.text(book.content.title, 20, 30);
  pdf.setFontSize(12);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
  
  // Sinopse
  pdf.setFontSize(14);
  pdf.text('Sinopse', 20, 65);
  pdf.setFontSize(10);
  const synopsisLines = pdf.splitTextToSize(book.content.synopsis, 170);
  pdf.text(synopsisLines, 20, 75);
  
  let yPosition = 100;
  
  // Capítulos
  book.content.chapters.forEach((chapter: any, index: number) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.text(chapter.title, 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    const chapterLines = pdf.splitTextToSize(chapter.content, 170);
    
    // Verificar se precisa de nova página
    if (yPosition + (chapterLines.length * 5) > 280) {
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(12);
      pdf.text(chapter.title + ' (continuação)', 20, yPosition);
      yPosition += 10;
    }
    
    pdf.text(chapterLines, 20, yPosition);
    yPosition += (chapterLines.length * 5) + 15;
  });
  
  pdf.save(`${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  return true;
}

// Exportar para DOCX (melhorado)
export async function exportToDOCX(book: any): Promise<boolean> {
  try {
    console.log('📝 Iniciando exportação DOCX...');
    
    let docContent = `TÍTULO: ${book.content.title}\n`;
    docContent += '='.repeat(60) + '\n\n';
    
    docContent += `DATA: ${new Date().toLocaleDateString('pt-BR')}\n`;
    docContent += `GÊNERO: ${book.config.genre}\n`;
    docContent += `PÚBLICO: ${book.config.audience}\n`;
    docContent += `CAPÍTULOS: ${book.content.chapters.length}\n\n`;
    
    docContent += 'GERADO POR: Gerador de Livros IA\n';
    docContent += '='.repeat(60) + '\n\n';
    
    // Sinopse
    docContent += 'SINOPSE\n';
    docContent += '-'.repeat(40) + '\n\n';
    docContent += book.content.synopsis + '\n\n';
    
    // Descrição original
    docContent += 'DESCRIÇÃO ORIGINAL\n';
    docContent += '-'.repeat(40) + '\n\n';
    docContent += `"${book.description}"\n\n`;
    
    docContent += '='.repeat(60) + '\n\n';
    
    // Capítulos
    docContent += 'CAPÍTULOS\n';
    docContent += '='.repeat(60) + '\n\n';
    
    book.content.chapters.forEach((chapter: any, index: number) => {
      docContent += `CAPÍTULO ${index + 1}: ${chapter.title}\n`;
      docContent += '-'.repeat(50) + '\n\n';
      docContent += chapter.content + '\n\n';
      docContent += '―'.repeat(30) + '\n\n';
    });
    
    // Rodapé
    docContent += '\n' + '='.repeat(60) + '\n';
    docContent += 'Gerado por Gerador de Livros IA\n';
    docContent += `${typeof window !== 'undefined' ? window.location.hostname : 'gerador-livros-ia'}\n`;
    docContent += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    docContent += '='.repeat(60) + '\n';

    // Criar e baixar arquivo
    const blob = new Blob([docContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ DOCX exportado com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao exportar DOCX:', error);
    throw new Error('Erro ao gerar DOCX');
  }
}

// Exportar para TXT (melhorado)
export async function exportToTXT(book: any): Promise<boolean> {
  try {
    let txtContent = '';
    
    // Cabeçalho formatado
    txtContent += '✨ '.repeat(15) + '\n';
    txtContent += `TÍTULO: ${book.content.title}\n`;
    txtContent += '✨ '.repeat(15) + '\n\n';
    
    txtContent += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    txtContent += `🎭 Gênero: ${book.config.genre}\n`;
    txtContent += `👥 Público: ${book.config.audience}\n`;
    txtContent += `📚 Capítulos: ${book.content.chapters.length}\n\n`;
    
    txtContent += '―'.repeat(40) + '\n\n';
    
    // Sinopse
    txtContent += 'SINOPSE:\n';
    txtContent += '―'.repeat(20) + '\n';
    txtContent += book.content.synopsis + '\n\n';
    
    // Descrição original
    txtContent += 'DESCRIÇÃO ORIGINAL:\n';
    txtContent += '―'.repeat(25) + '\n';
    txtContent += `"${book.description}"\n\n`;
    
    txtContent += '═'.repeat(50) + '\n\n';
    
    // Capítulos
    book.content.chapters.forEach((chapter: any, index: number) => {
      txtContent += `CAPÍTULO ${index + 1}\n`;
      txtContent += `❖ ${chapter.title}\n`;
      txtContent += '―'.repeat(40) + '\n\n';
      txtContent += chapter.content + '\n\n';
      txtContent += '※'.repeat(20) + '\n\n';
    });
    
    // Rodapé
    txtContent += '═'.repeat(50) + '\n';
    txtContent += 'Gerado por Gerador de Livros IA\n';
    txtContent += `${typeof window !== 'undefined' ? window.location.hostname : 'gerador-livros-ia'}\n`;
    txtContent += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    txtContent += '═'.repeat(50) + '\n';

    const blob = new Blob([txtContent], { type: 'text/plain; charset=utf-8' });
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
    console.error('❌ Erro ao exportar TXT:', error);
    throw new Error('Erro ao gerar TXT');
  }
}
