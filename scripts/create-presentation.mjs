import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Campus News';
pptx.subject = 'Apresentacao do Campus News';
pptx.title = 'Campus News | Apresentacao';
pptx.company = 'Campus News';
pptx.lang = 'pt-BR';
pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'pt-BR' };

const colors = {
  navy: '102A43',
  blue: '155EEF',
  slate: '486581',
  muted: '627D98',
  line: 'D9E2EC',
  pale: 'F4F7FB',
  white: 'FFFFFF'
};

function addTopBar(slide) {
  slide.background = { color: colors.pale };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.14,
    line: { color: colors.blue, transparency: 100 },
    fill: { color: colors.blue }
  });
}

function addFooter(slide, page) {
  slide.addText(`CAMPUS NEWS  /  ${String(page).padStart(2, '0')}`, {
    x: 0.72, y: 7.15, w: 2.2, h: 0.15,
    fontSize: 7, bold: true, color: colors.muted, charSpacing: 1, margin: 0
  });
  slide.addText('CAMPUS ACCESS  •  INFORMAÇÃO  •  OPERAÇÃO', {
    x: 8.2, y: 7.15, w: 4.4, h: 0.15,
    fontSize: 7, bold: true, color: colors.blue, align: 'right', charSpacing: 0.8, margin: 0
  });
}

function addImageFrame(slide, path, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    line: { color: colors.line, width: 1 },
    fill: { color: colors.white },
    shadow: { type: 'outer', color: '9FB3C8', opacity: 0.2, blur: 2, angle: 45, distance: 1 }
  });
  slide.addImage({ path, x: x + 0.15, y: y + 0.15, w: w - 0.3, h: h - 0.3 });
}

function addScreenSlide({ page, eyebrow, title, description, image, label }) {
  const slide = pptx.addSlide();
  addTopBar(slide);
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.72, y: 0.55, w: 3.4, h: 0.2,
    fontSize: 8, bold: true, color: colors.blue, charSpacing: 1.2, margin: 0
  });
  slide.addText(title, {
    x: 0.72, y: 0.92, w: 5.25, h: 0.55,
    fontFace: 'Aptos Display', fontSize: 26, bold: true, color: colors.navy, margin: 0
  });
  slide.addText(description, {
    x: 0.74, y: 1.62, w: 4.6, h: 0.7,
    fontSize: 12, color: colors.slate, breakLine: false, fit: 'shrink', margin: 0
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.74, y: 2.54, w: 1.25, h: 0,
    line: { color: colors.blue, width: 2 }
  });
  slide.addText(label, {
    x: 0.74, y: 2.75, w: 3.6, h: 0.34,
    fontSize: 10, bold: true, color: colors.blue, margin: 0
  });
  addImageFrame(slide, image, 6.05, 0.62, 6.55, 5.95);
  addFooter(slide, page);
}

const cover = pptx.addSlide();
addTopBar(cover);
cover.addText('CAMPUS NEWS', {
  x: 0.72, y: 0.62, w: 4.5, h: 0.25,
  fontSize: 9, bold: true, color: colors.blue, charSpacing: 1.6, margin: 0
});
cover.addText('Um campus mais\nconectado.', {
  x: 0.72, y: 1.35, w: 5.2, h: 1.3,
  fontFace: 'Aptos Display', fontSize: 34, bold: true, color: colors.navy, margin: 0
});
cover.addText('Uma experiência digital para acessar informações, consultar espaços, entrar em filas e operar o campus com clareza.', {
  x: 0.75, y: 2.95, w: 4.7, h: 0.9,
  fontSize: 14, color: colors.slate, fit: 'shrink', margin: 0
});
cover.addText('APRESENTAÇÃO DO PRODUTO  /  2026', {
  x: 0.75, y: 5.9, w: 3.6, h: 0.2,
  fontSize: 8, bold: true, color: colors.muted, charSpacing: 1, margin: 0
});
addImageFrame(cover, 'presentation-login.png', 6.35, 0.6, 5.8, 5.95);
addFooter(cover, 1);

addScreenSlide({
  page: 2,
  eyebrow: 'Visão geral',
  title: 'Tudo começa no painel.',
  description: 'O usuário encontra o estado do campus, alertas importantes e os caminhos mais usados em poucos segundos.',
  image: 'presentation-home.png',
  label: 'PAINEL PRINCIPAL'
});

addScreenSlide({
  page: 3,
  eyebrow: 'Infraestrutura',
  title: 'Salas sob controle.',
  description: 'Busca rápida por sala ou bloco, status de ocupação, capacidade e próxima aula em uma leitura simples.',
  image: 'presentation-rooms.png',
  label: 'CONSULTA DE SALAS'
});

addScreenSlide({
  page: 4,
  eyebrow: 'Atendimento',
  title: 'Menos espera, mais previsibilidade.',
  description: 'A fila virtual mostra demanda e tempo estimado para que cada pessoa escolha o melhor momento de atendimento.',
  image: 'presentation-queues.png',
  label: 'GESTÃO DE FILAS'
});

addScreenSlide({
  page: 5,
  eyebrow: 'Docência',
  title: 'Ferramentas para quem ensina.',
  description: 'O professor acompanha a aula e acessa presença, reservas, avisos, relatórios, notas e desempenho no mesmo espaço.',
  image: 'presentation-professor.png',
  label: 'PAINEL DO PROFESSOR'
});

addScreenSlide({
  page: 6,
  eyebrow: 'Administração',
  title: 'Gestão que vira ação.',
  description: 'Notícias e salas podem ser administradas em tempo real, com controle de conteúdo e operação em um único módulo.',
  image: 'presentation-admin.png',
  label: 'CENTRAL ADMINISTRATIVA'
});

const end = pptx.addSlide();
addTopBar(end);
end.addText('CAMPUS NEWS', {
  x: 0.72, y: 0.62, w: 4.5, h: 0.25,
  fontSize: 9, bold: true, color: colors.blue, charSpacing: 1.6, margin: 0
});
end.addText('Uma única experiência\npara todo o campus.', {
  x: 0.72, y: 1.35, w: 5.6, h: 1.35,
  fontFace: 'Aptos Display', fontSize: 30, bold: true, color: colors.navy, margin: 0
});
end.addText('Acesso seguro. Informação atualizada. Operação mais inteligente.', {
  x: 0.75, y: 3.05, w: 5.7, h: 0.42,
  fontSize: 15, color: colors.slate, margin: 0
});
end.addShape(pptx.ShapeType.roundRect, {
  x: 0.75, y: 4.3, w: 5.25, h: 1.05,
  rectRadius: 0.08,
  line: { color: colors.blue, width: 1 },
  fill: { color: 'E8F0FF' }
});
end.addText('CONECTAR  •  INFORMAR  •  ORGANIZAR', {
  x: 1.05, y: 4.68, w: 4.65, h: 0.2,
  fontSize: 11, bold: true, color: colors.blue, charSpacing: 0.8, align: 'center', margin: 0
});
addImageFrame(end, 'presentation-home.png', 7.15, 0.78, 4.85, 5.75);
addFooter(end, 7);

await pptx.writeFile({ fileName: 'Campus-News-Apresentacao.pptx' });
