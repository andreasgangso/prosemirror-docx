import { Paragraph, TextRun, ExternalHyperlink, MathRun, Math, TabStopType, TabStopPosition, SequentialIdentifier, Bookmark, ImageRun, AlignmentType, Table, TableRow, TableCell, InternalHyperlink, SimpleField, FootnoteReferenceRun, } from 'docx';
import sizeOf from 'buffer-image-size';
import { createNumbering } from './numbering.js';
import { createDocFromState, createShortId } from './utils.js';
const MAX_IMAGE_WIDTH = 600;
function createReferenceBookmark(id, kind, before, after) {
    const textBefore = before ? [new TextRun(before)] : [];
    const textAfter = after ? [new TextRun(after)] : [];
    return new Bookmark({
        id,
        children: [...textBefore, new SequentialIdentifier(kind), ...textAfter],
    });
}
export class DocxSerializerState {
    nodes;
    options;
    marks;
    children;
    numbering;
    footnotes = {};
    nextRunOpts;
    current = [];
    currentLink;
    // Optionally add options
    nextParentParagraphOpts;
    currentNumbering;
    constructor(nodes, marks, options) {
        this.nodes = nodes;
        this.marks = marks;
        this.options = options ?? {};
        this.children = [];
        this.numbering = [];
    }
    renderContent(parent, opts) {
        parent.forEach((node, _, i) => {
            if (opts)
                this.addParagraphOptions(opts);
            this.render(node, parent, i);
        });
    }
    render(node, parent, index) {
        if (typeof parent === 'number')
            throw new Error('!');
        if (!this.nodes[node.type.name])
            throw new Error(`Token type \`${node.type.name}\` not supported by Word renderer`);
        this.nodes[node.type.name](this, node, parent, index);
    }
    renderMarks(node, marks) {
        return marks
            .map((mark) => {
            return this.marks[mark.type.name]?.(this, node, mark);
        })
            .reduce((a, b) => ({ ...a, ...b }), {});
    }
    renderInline(parent) {
        // Pop the stack over to this object when we encounter a link, and closeLink restores it
        let currentLink;
        const closeLink = () => {
            if (!currentLink)
                return;
            const hyperlink = new ExternalHyperlink({
                link: currentLink.link,
                // child: this.current[0],
                children: this.current,
            });
            this.current = [...currentLink.stack, hyperlink];
            currentLink = undefined;
        };
        const openLink = (href) => {
            const sameLink = href === currentLink?.link;
            this.addRunOptions({ style: 'Hyperlink' });
            // TODO: https://github.com/dolanmiu/docx/issues/1119
            // Remove the if statement here and oneLink!
            const oneLink = true;
            if (!oneLink) {
                closeLink();
            }
            else {
                if (currentLink && sameLink)
                    return;
                if (currentLink && !sameLink) {
                    // Close previous, and open a new one
                    closeLink();
                }
            }
            currentLink = {
                link: href,
                stack: this.current,
            };
            this.current = [];
        };
        const progress = (node, offset, index) => {
            const links = node.marks.filter((m) => m.type.name === 'link');
            const hasLink = links.length > 0;
            if (hasLink) {
                openLink(links[0].attrs.href);
            }
            else if (!hasLink && currentLink) {
                closeLink();
            }
            if (node.isText) {
                this.text(node.text, this.renderMarks(node, [...node.marks]));
            }
            else {
                this.render(node, parent, index);
            }
        };
        parent.forEach(progress);
        // Must call close at the end of everything, just in case
        closeLink();
    }
    renderList(node, style) {
        if (!this.currentNumbering) {
            const nextId = createShortId();
            this.numbering.push(createNumbering(nextId, style));
            this.currentNumbering = { reference: nextId, level: 0 };
        }
        else {
            const { reference, level } = this.currentNumbering;
            this.currentNumbering = { reference, level: level + 1 };
        }
        this.renderContent(node);
        if (this.currentNumbering.level === 0) {
            delete this.currentNumbering;
        }
        else {
            const { reference, level } = this.currentNumbering;
            this.currentNumbering = { reference, level: level - 1 };
        }
    }
    // This is a pass through to the paragraphs, etc. underneath they will close the block
    renderListItem(node) {
        if (!this.currentNumbering)
            throw new Error('Trying to create a list item without a list?');
        this.addParagraphOptions({ numbering: this.currentNumbering });
        this.renderContent(node);
    }
    addParagraphOptions(opts) {
        this.nextParentParagraphOpts = { ...this.nextParentParagraphOpts, ...opts };
    }
    addRunOptions(opts) {
        this.nextRunOpts = { ...this.nextRunOpts, ...opts };
    }
    text(text, opts) {
        if (!text)
            return;
        this.current.push(new TextRun({ text, ...this.nextRunOpts, ...opts }));
        delete this.nextRunOpts;
    }
    math(latex, opts = { inline: true }) {
        if (opts.inline || !opts.numbered) {
            this.current.push(new Math({ children: [new MathRun(latex)] }));
            return;
        }
        const id = opts.id ?? createShortId();
        this.current = [
            new TextRun('\t'),
            new Math({
                children: [new MathRun(latex)],
            }),
            new TextRun('\t('),
            createReferenceBookmark(id, 'Equation'),
            new TextRun(')'),
        ];
        this.addParagraphOptions({
            tabStops: [
                {
                    type: TabStopType.CENTER,
                    position: TabStopPosition.MAX / 2,
                },
                {
                    type: TabStopType.RIGHT,
                    position: TabStopPosition.MAX,
                },
            ],
        });
    }
    // not sure what this actually is, seems to be close for 8.5x11
    maxImageWidth = MAX_IMAGE_WIDTH;
    image(src, widthPercent = 70, align = 'center', imageRunOpts) {
        const buffer = this.options.getImageBuffer(src);
        const dimensions = sizeOf(buffer);
        const aspect = dimensions.height / dimensions.width;
        const width = this.maxImageWidth * (widthPercent / 100);
        this.current.push(new ImageRun({
            ...imageRunOpts,
            data: buffer,
            type: 'png',
            transformation: {
                ...(imageRunOpts?.transformation || {}),
                width,
                height: width * aspect,
            },
        }));
        let alignment;
        switch (align) {
            case 'right':
                alignment = AlignmentType.RIGHT;
                break;
            case 'left':
                alignment = AlignmentType.LEFT;
                break;
            default:
                alignment = AlignmentType.CENTER;
        }
        this.addParagraphOptions({
            // TODO: fix
            alignment: alignment,
        });
    }
    table(node, opts = {}) {
        const { getCellOptions, getRowOptions, tableOptions } = opts;
        const actualChildren = this.children;
        const rows = [];
        node.content.forEach((row) => {
            const cells = [];
            // Check if all cells are headers in this row
            let tableHeader = true;
            row.content.forEach((cell) => {
                if (cell.type.name !== 'table_header') {
                    tableHeader = false;
                }
            });
            // This scales images inside of tables
            this.maxImageWidth = MAX_IMAGE_WIDTH / row.content.childCount;
            row.content.forEach((cell) => {
                this.children = [];
                this.renderContent(cell);
                const tableCellOpts = { children: this.children };
                const colspan = cell.attrs.colspan ?? 1;
                const rowspan = cell.attrs.rowspan ?? 1;
                if (colspan > 1)
                    tableCellOpts.columnSpan = colspan;
                if (rowspan > 1)
                    tableCellOpts.rowSpan = rowspan;
                cells.push(new TableCell({
                    ...tableCellOpts,
                    ...(getCellOptions?.(cell) || {}),
                }));
            });
            rows.push(new TableRow({ ...(getRowOptions?.(row) || {}), children: cells, tableHeader }));
        });
        this.maxImageWidth = MAX_IMAGE_WIDTH;
        const table = new Table({ ...tableOptions, rows });
        actualChildren.push(table);
        // If there are multiple tables, this seperates them
        actualChildren.push(new Paragraph(''));
        this.children = actualChildren;
    }
    captionLabel(id, kind, { suffix } = { suffix: ': ' }) {
        this.current.push(...[createReferenceBookmark(id, kind, `${kind} `), new TextRun(suffix)]);
    }
    $footnoteCounter = 0;
    footnote(node) {
        const { current, nextRunOpts } = this;
        // Delete everything and work with the footnote inline on the current
        this.current = [];
        delete this.nextRunOpts;
        this.$footnoteCounter += 1;
        this.renderInline(node);
        this.footnotes[this.$footnoteCounter] = {
            children: [new Paragraph({ children: this.current })],
        };
        this.current = current;
        this.nextRunOpts = nextRunOpts;
        this.current.push(new FootnoteReferenceRun(this.$footnoteCounter));
    }
    closeBlock(node, props) {
        const paragraph = new Paragraph({
            children: this.current,
            ...this.nextParentParagraphOpts,
            ...props,
        });
        this.current = [];
        delete this.nextParentParagraphOpts;
        this.children.push(paragraph);
    }
    createReference(id, before, after) {
        const children = [];
        if (before)
            children.push(new TextRun(before));
        children.push(new SimpleField(`REF ${id} \\h`));
        if (after)
            children.push(new TextRun(after));
        const ref = new InternalHyperlink({ anchor: id, children });
        this.current.push(ref);
    }
}
export class DocxSerializer {
    nodes;
    marks;
    constructor(nodes, marks) {
        this.nodes = nodes;
        this.marks = marks;
    }
    serialize(content, options) {
        const state = new DocxSerializerState(this.nodes, this.marks, options);
        state.renderContent(content);
        const doc = createDocFromState(state);
        return doc;
    }
}
//# sourceMappingURL=serializer.js.map