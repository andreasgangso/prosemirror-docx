import { Document, Packer, SectionType } from 'docx';
export function createShortId() {
    return Math.random().toString(36).substr(2, 9);
}
export function createDocFromState(state) {
    const doc = new Document({
        footnotes: state.footnotes,
        numbering: {
            config: state.numbering,
        },
        sections: [
            {
                properties: {
                    type: SectionType.CONTINUOUS,
                },
                children: state.children,
            },
        ],
    });
    return doc;
}
export async function writeDocx(doc, write) {
    const buffer = await Packer.toBuffer(doc);
    return write(buffer);
}
export function getLatexFromNode(node) {
    let math = '';
    node.forEach((child) => {
        if (child.isText)
            math += child.text;
        // TODO: improve this as we may have other things in the future
    });
    return math;
}
//# sourceMappingURL=utils.js.map