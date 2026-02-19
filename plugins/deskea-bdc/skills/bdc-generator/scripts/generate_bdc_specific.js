#!/usr/bin/env node
// ============================================================
// Deskea BDC Specific Generator
// Generates a completed Bon de Commande from a JSON config
// ============================================================

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');

// ============ CONFIG ============
const configArg = process.argv[2];
if (!configArg) {
  console.error("Usage: node generate_bdc_specific.js '<JSON_CONFIG>'");
  console.error("  or:  node generate_bdc_specific.js path/to/config.json");
  process.exit(1);
}

let config;
try {
  // Try as file path first, then as inline JSON
  if (fs.existsSync(configArg)) {
    config = JSON.parse(fs.readFileSync(configArg, 'utf8'));
  } else {
    config = JSON.parse(configArg);
  }
} catch (e) {
  console.error("Error parsing config:", e.message);
  process.exit(1);
}

// ============ DEFAULTS ============
const defaults = {
  deskea: {
    raisonSociale: "Groupe Tersea SAS",
    adresse: "1 Chemin de la Loge \u2013 31100 Toulouse",
    rcs: "RCS Toulouse 443 061 841",
    representant: "S\u00E9bastien Monnier, Pr\u00E9sident"
  },
  contrat: {
    duree: "12 mois",
    hebergement: "Cloud s\u00E9curis\u00E9 en Europe (OVHcloud / AWS / Google Cloud), conforme RGPD."
  },
  financier: {
    facturation: "mensuelle \u00E0 terme \u00E0 \u00E9choir",
    paiement: "30 jours date de facture, par virement ou pr\u00E9l\u00E8vement SEPA"
  }
};

// Merge defaults
config.deskea = { ...defaults.deskea, ...(config.deskea || {}) };
config.contrat = { ...defaults.contrat, ...(config.contrat || {}) };
config.financier = { ...defaults.financier, ...(config.financier || {}) };

// ============ LAYOUT ============
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN = 1440;
const CW = PAGE_WIDTH - 2 * MARGIN;

const C = {
  primary: "1B3A5C",
  secondary: "2E75B6",
  accent: "4A90D9",
  text: "333333",
  lightGray: "F2F4F7",
  medGray: "D9DEE4",
  white: "FFFFFF",
  lightBlue: "E8F0FE",
  green: "E8F5E9",
  inactiveText: "AAAAAA",
  inactiveBg: "F8F8F8",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: C.medGray };
const borders = { top: border, bottom: border, left: border, right: border };

// ============ HELPERS ============
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 28, font: "Arial", color: C.primary })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: C.secondary })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.sb || 60, after: opts.sa || 60 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 20, font: "Arial", color: C.text, ...opts.run })],
  });
}
function empty() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [] });
}

function cell(texts, opts = {}) {
  const runs = (Array.isArray(texts) ? texts : [texts]).map(t =>
    typeof t === 'string'
      ? new TextRun({ text: t, size: opts.size || 18, font: "Arial", color: opts.color || C.text })
      : new TextRun({ size: opts.size || 18, font: "Arial", color: opts.color || C.text, ...t })
  );
  return new TableCell({
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
      children: runs,
    })],
  });
}

function headerCell(text, w) {
  return cell([{ text, bold: true, color: C.white }], { bg: C.primary, width: w, align: AlignmentType.CENTER, size: 18 });
}

function checkRow(label, description, checked = false) {
  const isActive = checked;
  const check = checked ? "\u2611" : "\u2610";
  const textColor = isActive ? C.text : C.inactiveText;
  const bgColor = isActive ? undefined : C.inactiveBg;
  return new TableRow({
    children: [
      cell([{ text: check, size: 22, color: textColor }], { width: 500, align: AlignmentType.CENTER, bg: bgColor }),
      cell([{ text: label, bold: isActive, color: textColor }], { width: 2500, bg: bgColor }),
      cell([{ text: description, color: textColor }], { width: CW - 3000, bg: bgColor }),
    ],
  });
}

function dataRow(col1, col2, opts = {}) {
  return new TableRow({
    children: [
      cell([{ text: col1, bold: true }], { width: 3200, bg: opts.bg1 || C.lightGray }),
      cell(col2, { width: CW - 3200, bg: opts.bg2 }),
    ],
  });
}

function slaRow(level, desc, responseTime, resolutionTime, bg) {
  return new TableRow({
    children: [
      cell([{ text: level, bold: true }], { width: 1800, bg, align: AlignmentType.CENTER }),
      cell(desc, { width: CW - 4800 }),
      cell([{ text: responseTime, bold: true }], { width: 1500, align: AlignmentType.CENTER }),
      cell([{ text: resolutionTime, bold: true }], { width: 1500, align: AlignmentType.CENTER }),
    ],
  });
}

// ============ SOLUTION DESCRIPTIONS ============
const solutionDescriptions = {
  engage: "Agent conversationnel Voix & SMS \u2013 Automatisation 24/7 des demandes fr\u00E9quentes, prise de RDV, qualification d\u2019appels, campagnes de notifications.",
  qualify: "Qualification et routage automatis\u00E9s \u2013 Analyse IA des emails entrants, identification de la th\u00E9matique et routage vers l\u2019\u00E9quipe comp\u00E9tente.",
  assist: "Assistant conseillers (r\u00E9daction IA) \u2013 Correction, reformulation, traduction, synth\u00E8se, composition et g\u00E9n\u00E9ration de r\u00E9ponses assist\u00E9es.",
  assistKB: "Option Base de Connaissances \u2013 Chatbot m\u00E9tier intelligent form\u00E9 sur les donn\u00E9es internes du Client, recherche instantan\u00E9e.",
  evaluateAudio: "Analyse conversationnelle Audio \u2013 Transcription, r\u00E9sum\u00E9s, quality monitoring (auto/hybride/manuel), voix du client, tableaux de bord.",
  evaluateMessages: "Analyse conversationnelle \u00C9crite \u2013 M\u00EAmes fonctionnalit\u00E9s que Audio, appliqu\u00E9es aux conversations \u00E9crites (email, chat, r\u00E9seaux sociaux).",
};

// ============ COMPUTE FINANCIALS ============
const sol = config.solutions || {};
const isAssistExpert = sol.assist && sol.assist.active && sol.assist.type === 'expert';

// Build pricing rows
function buildPricingRows() {
  const rows = [];
  const hdr = new TableRow({ children: [
    headerCell("R\u00E9f.", 900), headerCell("D\u00E9signation", 3000),
    headerCell("Qt\u00E9", 600), headerCell("P.U. HT", 1200),
    headerCell("Fr\u00E9q.", 900), headerCell("Total HT/an", 1200),
  ]});
  rows.push(hdr);

  if (sol.engage && sol.engage.active) {
    rows.push(new TableRow({ children: [
      cell("ENG-001", { width: 900 }), cell("Deskea Engage \u2013 Voicebot/SMSbot", { width: 3000 }),
      cell(sol.engage.volume || "__", { width: 600 }), cell(sol.engage.prixUnitaire || "__ \u20AC/min", { width: 1200 }),
      cell("/mois", { width: 900 }), cell(sol.engage.totalAnnuel || "__ \u20AC", { width: 1200 }),
    ]}));
  }
  if (sol.qualify && sol.qualify.active) {
    rows.push(new TableRow({ children: [
      cell("QUA-001", { width: 900 }), cell("Deskea Qualify \u2013 Routage IA", { width: 3000 }),
      cell(sol.qualify.volume || "__", { width: 600 }), cell(sol.qualify.prixUnitaire || "__ \u20AC/email", { width: 1200 }),
      cell("/mois", { width: 900 }), cell(sol.qualify.totalAnnuel || "__ \u20AC", { width: 1200 }),
    ]}));
  }
  if (sol.assist && sol.assist.active) {
    if (sol.assist.type === 'expert') {
      rows.push(new TableRow({ children: [
        cell("ASS-002", { width: 900 }), cell("Deskea Assist \u2013 Expert (avec Base de Co.)", { width: 3000 }),
        cell(sol.assist.volume || "__", { width: 600 }), cell(sol.assist.prixUnitaire || "__ \u20AC/util.", { width: 1200 }),
        cell("/mois", { width: 900 }), cell(sol.assist.totalAnnuel || "__ \u20AC", { width: 1200 }),
      ]}));
    } else {
      rows.push(new TableRow({ children: [
        cell("ASS-001", { width: 900 }), cell("Deskea Assist \u2013 R\u00E9daction IA", { width: 3000 }),
        cell(sol.assist.volume || "__", { width: 600 }), cell(sol.assist.prixUnitaire || "__ \u20AC/util.", { width: 1200 }),
        cell("/mois", { width: 900 }), cell(sol.assist.totalAnnuel || "__ \u20AC", { width: 1200 }),
      ]}));
    }
  }
  if (sol.evaluateAudio && sol.evaluateAudio.active) {
    rows.push(new TableRow({ children: [
      cell("EVA-001", { width: 900 }), cell("Deskea Evaluate \u2013 Audio", { width: 3000 }),
      cell(sol.evaluateAudio.volume || "__", { width: 600 }), cell(sol.evaluateAudio.prixUnitaire || "__ \u20AC/min", { width: 1200 }),
      cell("/mois", { width: 900 }), cell(sol.evaluateAudio.totalAnnuel || "__ \u20AC", { width: 1200 }),
    ]}));
  }
  if (sol.evaluateMessages && sol.evaluateMessages.active) {
    rows.push(new TableRow({ children: [
      cell("EVA-002", { width: 900 }), cell("Deskea Evaluate \u2013 Messages", { width: 3000 }),
      cell(sol.evaluateMessages.volume || "__", { width: 600 }), cell(sol.evaluateMessages.prixUnitaire || "__ \u20AC/msg", { width: 1200 }),
      cell("/mois", { width: 900 }), cell(sol.evaluateMessages.totalAnnuel || "__ \u20AC", { width: 1200 }),
    ]}));
  }
  return rows;
}

function buildSetupRows() {
  const rows = [];
  const hdr = new TableRow({ children: [
    headerCell("R\u00E9f.", 900), headerCell("D\u00E9signation", 3600),
    headerCell("Qt\u00E9", 600), headerCell("P.U. HT", 1200),
    headerCell("Total HT", 1500),
  ]});
  rows.push(hdr);

  let hasSetup = false;

  if (sol.engage && sol.engage.active && sol.engage.setup) {
    rows.push(new TableRow({ children: [
      cell("SET-ENG", { width: 900 }), cell("Setup Deskea Engage", { width: 3600 }),
      cell("1", { width: 600 }), cell(`${sol.engage.setup} \u20AC`, { width: 1200 }),
      cell(`${sol.engage.setup} \u20AC`, { width: 1500 }),
    ]}));
    hasSetup = true;
  }
  if (sol.assist && sol.assist.active && sol.assist.setup) {
    rows.push(new TableRow({ children: [
      cell("SET-ASS", { width: 900 }), cell("Setup Deskea Assist (Base de Connaissances)", { width: 3600 }),
      cell("1", { width: 600 }), cell(`${sol.assist.setup} \u20AC`, { width: 1200 }),
      cell(`${sol.assist.setup} \u20AC`, { width: 1500 }),
    ]}));
    hasSetup = true;
  }
  if (sol.evaluateAudio && sol.evaluateAudio.active && sol.evaluateAudio.setup) {
    rows.push(new TableRow({ children: [
      cell("SET-EVA", { width: 900 }), cell("Setup Deskea Evaluate Audio", { width: 3600 }),
      cell("1", { width: 600 }), cell(`${sol.evaluateAudio.setup} \u20AC`, { width: 1200 }),
      cell(`${sol.evaluateAudio.setup} \u20AC`, { width: 1500 }),
    ]}));
    hasSetup = true;
  }
  if (sol.evaluateMessages && sol.evaluateMessages.active && sol.evaluateMessages.setup) {
    rows.push(new TableRow({ children: [
      cell("SET-EVM", { width: 900 }), cell("Setup Deskea Evaluate Messages", { width: 3600 }),
      cell("1", { width: 600 }), cell(`${sol.evaluateMessages.setup} \u20AC`, { width: 1200 }),
      cell(`${sol.evaluateMessages.setup} \u20AC`, { width: 1500 }),
    ]}));
    hasSetup = true;
  }

  // Always add formation and integration lines
  rows.push(new TableRow({ children: [
    cell("FOR-001", { width: 900 }), cell("Formation utilisateurs", { width: 3600 }),
    cell(config.deploiement?.formation?.qty || "__", { width: 600 }),
    cell(config.deploiement?.formation?.pu || "__ \u20AC/sess.", { width: 1200 }),
    cell(config.deploiement?.formation?.total || "__ \u20AC", { width: 1500 }),
  ]}));
  rows.push(new TableRow({ children: [
    cell("INT-001", { width: 900 }), cell("Int\u00E9grations & Connecteurs (API, SI)", { width: 3600 }),
    cell(config.deploiement?.integration?.qty || "__", { width: 600 }),
    cell(config.deploiement?.integration?.pu || "__ \u20AC/j", { width: 1200 }),
    cell(config.deploiement?.integration?.total || "__ \u20AC", { width: 1500 }),
  ]}));

  return rows;
}

// ============ BUILD DOCUMENT ============
const bdcRef = config.bdcRef || `BDC-DESK-${new Date().getFullYear()}-___`;
const fin = config.financier;

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20, color: C.text } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.primary },
        paragraph: { spacing: { before: 360, after: 200 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.secondary },
        paragraph: { spacing: { before: 240, after: 120 } } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ],
    }],
  },
  sections: [
    {
      properties: {
        page: { size: { width: PAGE_WIDTH, height: PAGE_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: `Bon de Commande Deskea \u2013 ${bdcRef}`, size: 16, font: "Arial", color: C.secondary, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: C.medGray, space: 4 } },
            spacing: { before: 100 },
            children: [
              new TextRun({ text: "Deskea \u2013 Groupe Tersea | Confidentiel | Page ", size: 16, font: "Arial", color: C.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: C.secondary }),
            ],
          })],
        }),
      },
      children: [
        // TITLE
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 60 },
          children: [new TextRun({ text: "DESKEA", size: 44, bold: true, font: "Arial", color: C.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 120 },
          children: [new TextRun({ text: "BON DE COMMANDE", size: 36, bold: true, font: "Arial", color: C.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [new TextRun({ text: `R\u00E9f\u00E9rence : ${bdcRef}`, size: 20, font: "Arial", color: C.secondary })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "Plateforme SaaS \u2013 Relation Client & Intelligence Artificielle", size: 20, font: "Arial", color: C.text, italics: true })],
        }),

        // PARTIES
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("DESKEA (Groupe Tersea)", Math.floor(CW/2)),
              headerCell("CLIENT", Math.floor(CW/2)),
            ]}),
            new TableRow({ children: [
              cell(`${config.deskea.raisonSociale}\n${config.deskea.adresse}\nRCS : ${config.deskea.rcs}\nRepr\u00E9sent\u00E9 par : ${config.deskea.representant}`, { width: Math.floor(CW/2) }),
              cell(`${config.client.raisonSociale}\n${config.client.adresse}\nRCS : ${config.client.rcs}\nRepr\u00E9sent\u00E9 par : ${config.client.representant}`, { width: Math.floor(CW/2) }),
            ]}),
          ],
        }),

        empty(),
        p("Le Client reconna\u00EEt avoir re\u00E7u et accept\u00E9 les Conditions G\u00E9n\u00E9rales de Deskea (CGV v1.1). Le pr\u00E9sent Bon de Commande est r\u00E9gi par ces Conditions G\u00E9n\u00E9rales. En cas de contradiction, l\u2019ordre de pr\u00E9s\u00E9ance est : (1) le pr\u00E9sent Bon de Commande et ses annexes, (2) les Conditions G\u00E9n\u00E9rales."),

        empty(),
        // MAIN TERMS
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Date d\u2019effet", config.contrat.dateEffet || "__ / __ / ____"),
            dataRow("Dur\u00E9e d\u2019engagement", `${config.contrat.duree} \u00E0 compter de la mise en production.\nRenouvellement par tacite reconduction par p\u00E9riode(s) \u00E9quivalente(s), sauf d\u00E9nonciation avec pr\u00E9avis de 3 mois (LRAR ou e-mail avec AR).`),
            dataRow("Nombre d\u2019Utilisateurs", config.contrat.nbUtilisateurs || "[nombre] licences nomm\u00E9es \u00E0 la date d\u2019effet."),
            dataRow("H\u00E9bergement", config.contrat.hebergement),
            dataRow("Contact principal", `Nom : ${config.contact.nom}  |  Email : ${config.contact.email}  |  T\u00E9l : ${config.contact.tel}`),
          ],
        }),

        empty(),
        h1("Solutions souscrites"),
        p("Les solutions coch\u00E9es ci-dessous sont activ\u00E9es dans le cadre du pr\u00E9sent Bon de Commande. Les solutions non s\u00E9lectionn\u00E9es restent disponibles et pourront \u00EAtre ajout\u00E9es par avenant simplifi\u00E9.", { run: { italics: true } }),
        empty(),

        // PRODUCTS CHECKBOX TABLE
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("", 500),
              headerCell("Solution", 2500),
              headerCell("Description", CW - 3000),
            ]}),
            checkRow("Engage", solutionDescriptions.engage, !!(sol.engage && sol.engage.active)),
            checkRow("Qualify", solutionDescriptions.qualify, !!(sol.qualify && sol.qualify.active)),
            checkRow("Assist", solutionDescriptions.assist, !!(sol.assist && sol.assist.active && sol.assist.type !== 'expert')),
            checkRow("  + Base de Co.", solutionDescriptions.assistKB, !!(sol.assist && sol.assist.active && sol.assist.type === 'expert')),
            checkRow("Evaluate \u2013 Audio", solutionDescriptions.evaluateAudio, !!(sol.evaluateAudio && sol.evaluateAudio.active)),
            checkRow("Evaluate \u2013 Messages", solutionDescriptions.evaluateMessages, !!(sol.evaluateMessages && sol.evaluateMessages.active)),
          ],
        }),

        empty(),
        p("Clause d\u2019expansion : Toute souscription suppl\u00E9mentaire de licences ou de modules sera r\u00E9gie par les conditions tarifaires du pr\u00E9sent BDC et fera l\u2019objet d\u2019un avenant simplifi\u00E9 ou d\u2019une commande additionnelle sign\u00E9e par les Parties."),

        // PRICING SUMMARY
        empty(),
        h1("Synth\u00E8se financi\u00E8re"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Abonnement annuel HT", fin.abonnementAnnuelHT || "________ \u20AC"),
            dataRow("Prestations de d\u00E9ploiement HT", fin.deploiementHT || "________ \u20AC"),
            dataRow("TOTAL Ann\u00E9e 1 HT", fin.totalAn1HT || "________ \u20AC", { bg1: C.primary, bg2: C.lightBlue }),
            dataRow("Facturation", fin.facturation),
            dataRow("Paiement", fin.paiement),
            dataRow("R\u00E9vision", "Annuelle selon indice Syntec (cf. CGV art. 11.3)"),
          ],
        }),
        p(`\u00C0 partir de l\u2019ann\u00E9e 2, le montant annuel r\u00E9current est de ${fin.recurrentAn2HT || "__ \u20AC HT"}.`, { run: { italics: true } }),

        // SIGNATURES
        empty(),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("Pour Deskea (Groupe Tersea)", Math.floor(CW/2)),
              headerCell("Pour le CLIENT", Math.floor(CW/2)),
            ]}),
            new TableRow({ tableHeader: false, height: { value: 2000 }, children: [
              cell(`Nom : ${config.deskea.representant.split(',')[0]}\nFonction : ${(config.deskea.representant.split(',')[1] || '').trim()}\nDate : ____________________________\nSignature :`, { width: Math.floor(CW/2) }),
              cell(`Nom : ${config.client.representant.split(',')[0]}\nFonction : ${(config.client.representant.split(',')[1] || '').trim()}\nDate : ____________________________\nSignature et cachet :\n\nMention manuscrite \u00AB Bon pour accord \u00BB`, { width: Math.floor(CW/2) }),
            ]}),
          ],
        }),

        // ============================================================
        // ANNEXE 1 : GRILLE TARIFAIRE
        // ============================================================
        new Paragraph({ children: [new PageBreak()] }),
        h1("Annexe 1 \u2013 Grille tarifaire d\u00E9taill\u00E9e"),

        h2("A. Licences & Abonnements (r\u00E9current)"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: buildPricingRows(),
        }),

        empty(),
        h2("B. Prestations de d\u00E9ploiement (non r\u00E9current)"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: buildSetupRows(),
        }),

        // ============================================================
        // ANNEXE 2 : CAHIER DE DEPLOIEMENT
        // ============================================================
        new Paragraph({ children: [new PageBreak()] }),
        h1("Annexe 2 \u2013 Cahier de D\u00E9ploiement"),
        p("Cette annexe d\u00E9crit le p\u00E9rim\u00E8tre de d\u00E9ploiement de la plateforme Deskea et les prestations associ\u00E9es."),

        h2("1. P\u00E9rim\u00E8tre fonctionnel"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Objectif principal", config.deploiement?.objectif || "[D\u00E9crire en 1-2 phrases]"),
            dataRow("Modules activ\u00E9s", Object.entries(sol).filter(([k,v]) => v && v.active).map(([k]) => {
              const names = { engage: "Engage", qualify: "Qualify", assist: "Assist", evaluateAudio: "Evaluate Audio", evaluateMessages: "Evaluate Messages" };
              return names[k] || k;
            }).join(" / ")),
            dataRow("Volume pr\u00E9visionnel", config.deploiement?.volume || "[Nbre utilisateurs, nbre interactions/mois]"),
            dataRow("Syst\u00E8mes \u00E0 int\u00E9grer", config.deploiement?.systemes || "[CRM existant, t\u00E9l\u00E9phonie, SI client\u2026]"),
          ],
        }),

        empty(),
        h2("2. Planning pr\u00E9visionnel"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("Phase", 2500), headerCell("Dur\u00E9e estim\u00E9e", 2000),
              headerCell("Responsable", 2000),
            ]}),
            new TableRow({ children: [ cell("Cadrage & Kickoff"), cell("[__ semaines]"), cell("Deskea + Client") ]}),
            new TableRow({ children: [ cell("Param\u00E9trage & Int\u00E9grations"), cell("[__ semaines]"), cell("Deskea") ]}),
            new TableRow({ children: [ cell("Recette & Tests"), cell("[__ semaines]"), cell("Client (valid\u00E9 par Deskea)") ]}),
            new TableRow({ children: [ cell("Formation"), cell("[__ semaines]"), cell("Deskea") ]}),
            new TableRow({ children: [ cell("Mise en production"), cell("[date cible]"), cell("Deskea + Client") ]}),
            new TableRow({ children: [ cell("Hypercare (support renforc\u00E9)"), cell("[__ semaines]"), cell("Deskea") ]}),
          ],
        }),

        empty(),
        h2("3. Conditions de recette"),
        p("La recette sera r\u00E9put\u00E9e acquise \u00E0 l\u2019issue d\u2019une p\u00E9riode de dix (10) jours ouvr\u00E9s apr\u00E8s livraison, sauf r\u00E9serves formul\u00E9es par \u00E9crit par le Client. Les r\u00E9serves mineures ne font pas obstacle \u00E0 la mise en production."),

        // ============================================================
        // ANNEXE 3 : SLA
        // ============================================================
        new Paragraph({ children: [new PageBreak()] }),
        h1("Annexe 3 \u2013 Engagements de Niveaux de Service (SLA)"),

        h2("Disponibilit\u00E9"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Taux de disponibilit\u00E9 garanti", "99,8 % du temps, hors maintenance programm\u00E9e et force majeure"),
            dataRow("Calcul", "Mensuel : (Temps total \u2013 Temps d\u2019indisponibilit\u00E9) / Temps total"),
            dataRow("Maintenance programm\u00E9e", "Pr\u00E9avis 30 jours \u2013 max 6 MAJ majeures/an \u2013 max 3h/MAJ \u2013 max 18h/trimestre"),
            dataRow("Reporting", "Mensuel, envoy\u00E9 au Client avant le 5 du mois suivant"),
          ],
        }),

        empty(),
        h2("Garantie de Temps de R\u00E9tablissement (GTR)"),
        p("Le Prestataire s\u2019engage \u00E0 r\u00E9tablir le service dans les d\u00E9lais ci-dessous, \u00E0 compter de l\u2019ouverture du ticket d\u2019incident."),
        empty(),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("Niveau", 1800), headerCell("Description", CW - 4800),
              headerCell("D\u00E9lai r\u00E9ponse", 1500), headerCell("D\u00E9lai r\u00E9tabl.", 1500),
            ]}),
            slaRow("P1 \u2013 Critique", "Service totalement indisponible ou d\u00E9grad\u00E9 de mani\u00E8re critique pour l\u2019ensemble des utilisateurs.", "1h ouvr\u00E9e", "4h ouvr\u00E9es", C.white),
            slaRow("P2 \u2013 Majeur", "Fonctionnalit\u00E9 importante indisponible ou gravement d\u00E9grad\u00E9e, contournement possible.", "4h ouvr\u00E9es", "8h ouvr\u00E9es", C.white),
            slaRow("P3 \u2013 Mineur", "Anomalie non bloquante, impact limit\u00E9 sur l\u2019exploitation.", "8h ouvr\u00E9es", "5 jours ouvr\u00E9s", C.white),
          ],
        }),

        empty(),
        p("Les dysfonctionnements imputables au Client (mauvaise utilisation, modification non autoris\u00E9e, d\u00E9faut de l\u2019environnement Client) sont exclus de la GTR.", { run: { italics: true } }),

        empty(),
        h2("Support technique"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Canal de support", "support@deskea.com / portail en ligne"),
            dataRow("Horaires", "Lundi \u00E0 Vendredi, 9h \u2013 18h (heure de Paris)"),
            dataRow("Droit d\u2019audit", "Le Client peut demander des informations compl\u00E9mentaires \u00E0 tout moment"),
          ],
        }),

        empty(),
        h2("R\u00E9clamations"),
        p("Le Client adresse ses r\u00E9clamations par e-mail \u00E0 support@deskea.com en pr\u00E9cisant : informations de facturation, date/heure/dur\u00E9e de l\u2019indisponibilit\u00E9, et justification. Deskea r\u00E9pond sous 2 jours ouvr\u00E9s. En cas de d\u00E9saccord, les Parties s\u2019efforceront de trouver un accord amiable."),

        // ============================================================
        // ANNEXE 4 : FICHE DE TRAITEMENT
        // ============================================================
        new Paragraph({ children: [new PageBreak()] }),
        h1("Annexe 4 \u2013 Fiche de Traitement (donn\u00E9es \u00E0 caract\u00E8re personnel)"),
        p("Cette fiche d\u00E9crit le Traitement confi\u00E9 par le Client (Responsable de traitement) \u00E0 Deskea (Sous-traitant), conform\u00E9ment au DPA figurant en Annexe 1 des Conditions G\u00E9n\u00E9rales."),

        empty(),
        h2("Description du Traitement"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            dataRow("Description", config.rgpd?.description || "[D\u00E9crire le traitement sp\u00E9cifique]"),
            dataRow("Finalit\u00E9s", "Ex\u00E9cution des Services objet du Contrat"),
            dataRow("Personnes concern\u00E9es", config.rgpd?.personnes || "[Collaborateurs du Client, clients finaux, prospects\u2026]"),
            dataRow("Cat\u00E9gories de donn\u00E9es", config.rgpd?.categories || "[Identit\u00E9, coordonn\u00E9es, donn\u00E9es de conversation, historique\u2026]"),
            dataRow("Dur\u00E9e de conservation", "Pendant la dur\u00E9e du Contrat + 30 jours apr\u00E8s \u00E9ch\u00E9ance"),
            dataRow("DPO Deskea", config.rgpd?.dpoDeskea || "dpo@deskea.com"),
            dataRow("DPO Client", config.rgpd?.dpoClient || "[email DPO Client]"),
          ],
        }),

        empty(),
        h2("Sous-traitants ult\u00E9rieurs autoris\u00E9s"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              headerCell("Sous-traitant", 2000), headerCell("Service", 2500),
              headerCell("Localisation", 1500), headerCell("Garantie", 1800),
            ]}),
            new TableRow({ children: [ cell("OVHcloud"), cell("H\u00E9bergement"), cell("France"), cell("ISO 27001") ]}),
            new TableRow({ children: [ cell("AWS"), cell("Infrastructure"), cell("UE / EEE"), cell("SOC 2 Type II") ]}),
            new TableRow({ children: [ cell("Google Cloud"), cell("Services IA"), cell("UE / EEE"), cell("ISO 27001") ]}),
          ],
        }),
      ],
    },
  ],
});

// ============ GENERATE ============
const outputPath = config.outputPath || `/sessions/nice-compassionate-curie/mnt/CGS/BDC_${config.client.raisonSociale.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`;

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`BDC generated: ${outputPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error("Generation error:", err.message);
  process.exit(1);
});
