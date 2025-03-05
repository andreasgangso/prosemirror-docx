/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Node, Mark } from 'prosemirror-model';
import { IParagraphOptions, IRunOptions, Paragraph, ParagraphChild, Table, ITableCellOptions, IImageOptions, ITableOptions, ITableRowOptions } from 'docx';
import { NumberingStyles } from './numbering.js';
import { IFootnotes, INumbering } from './types.js';
export type AlignOptions = 'left' | 'center' | 'right';
export type NodeSerializer = Record<string, (state: DocxSerializerState, node: Node, parent: Node, index: number) => void>;
export type MarkSerializer = Record<string, (state: DocxSerializerState, node: Node, mark: Mark) => IRunOptions>;
export type Options = {
    getImageBuffer: (src: string) => Buffer;
};
export type IMathOpts = {
    inline?: boolean;
    id?: string | null;
    numbered?: boolean;
};
export declare class DocxSerializerState {
    nodes: NodeSerializer;
    options: Options;
    marks: MarkSerializer;
    children: (Paragraph | Table)[];
    numbering: INumbering[];
    footnotes: IFootnotes;
    nextRunOpts?: IRunOptions;
    current: ParagraphChild[];
    currentLink?: {
        link: string;
        children: IRunOptions[];
    };
    nextParentParagraphOpts?: IParagraphOptions;
    currentNumbering?: {
        reference: string;
        level: number;
    };
    constructor(nodes: NodeSerializer, marks: MarkSerializer, options: Options);
    renderContent(parent: Node, opts?: IParagraphOptions): void;
    render(node: Node, parent: Node, index: number): void;
    renderMarks(node: Node, marks: Mark[]): IRunOptions;
    renderInline(parent: Node): void;
    renderList(node: Node, style: NumberingStyles): void;
    renderListItem(node: Node): void;
    addParagraphOptions(opts: IParagraphOptions): void;
    addRunOptions(opts: IRunOptions): void;
    text(text: string | null | undefined, opts?: IRunOptions): void;
    math(latex: string, opts?: IMathOpts): void;
    maxImageWidth: number;
    image(src: string, widthPercent?: number, align?: AlignOptions, imageRunOpts?: IImageOptions): void;
    table(node: Node, opts?: {
        getCellOptions?: (cell: Node) => ITableCellOptions;
        getRowOptions?: (row: Node) => Omit<ITableRowOptions, 'children'>;
        tableOptions?: Omit<ITableOptions, 'rows'>;
    }): void;
    captionLabel(id: string, kind: 'Figure' | 'Table', { suffix }?: {
        suffix: string;
    }): void;
    $footnoteCounter: number;
    footnote(node: Node): void;
    closeBlock(node: Node, props?: IParagraphOptions): void;
    createReference(id: string, before?: string, after?: string): void;
}
export declare class DocxSerializer {
    nodes: NodeSerializer;
    marks: MarkSerializer;
    constructor(nodes: NodeSerializer, marks: MarkSerializer);
    serialize(content: Node, options: Options): import("docx").Document;
}
