/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Document, INumberingOptions, ISectionOptions } from 'docx';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { IFootnotes } from './types.js';
export declare function createShortId(): string;
export declare function createDocFromState(state: {
    numbering: INumberingOptions['config'];
    children: ISectionOptions['children'];
    footnotes?: IFootnotes;
}): Document;
export declare function writeDocx(doc: Document, write: ((buffer: Buffer) => void) | ((buffer: Buffer) => Promise<void>)): Promise<void>;
export declare function getLatexFromNode(node: ProsemirrorNode): string;
