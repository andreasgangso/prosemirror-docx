import { AlignmentType, convertInchesToTwip, LevelFormat } from 'docx';
function basicIndentStyle(indent) {
    return {
        alignment: AlignmentType.START,
        style: {
            paragraph: {
                indent: { left: convertInchesToTwip(indent), hanging: convertInchesToTwip(0.18) },
            },
        },
    };
}
const numbered = Array(3)
    .fill([LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN])
    .flat()
    .map((format, level) => ({
    level,
    format,
    text: `%${level + 1}.`,
    ...basicIndentStyle((level + 1) / 2),
}));
const bullets = Array(3)
    .fill(['●', '○', '■'])
    .flat()
    .map((text, level) => ({
    level,
    format: LevelFormat.BULLET,
    text,
    ...basicIndentStyle((level + 1) / 2),
}));
const styles = {
    numbered,
    bullets,
};
export function createNumbering(reference, style) {
    return {
        reference,
        levels: styles[style],
    };
}
//# sourceMappingURL=numbering.js.map