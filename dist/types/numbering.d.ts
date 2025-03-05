import { INumbering } from './types.js';
declare const styles: {
    numbered: {
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        alignment?: "start" | "center" | "end" | "both" | "mediumKashida" | "distribute" | "numTab" | "highKashida" | "lowKashida" | "thaiDistribute" | "left" | "right" | undefined;
        level: number;
        format: any;
        text: string;
    }[];
    bullets: {
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        alignment?: "start" | "center" | "end" | "both" | "mediumKashida" | "distribute" | "numTab" | "highKashida" | "lowKashida" | "thaiDistribute" | "left" | "right" | undefined;
        level: number;
        format: "bullet";
        text: any;
    }[];
};
export type NumberingStyles = keyof typeof styles;
export declare function createNumbering(reference: string, style: NumberingStyles): INumbering;
export {};
