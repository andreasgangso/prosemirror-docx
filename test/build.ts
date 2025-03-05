import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-test-builder';
import { builders } from 'prosemirror-test-builder';


export const tnodes = builders(schema, {
  p: { nodeType: 'paragraph' },
  h1: { nodeType: 'heading', level: 1 },
  h2: { nodeType: 'heading', level: 2 },
  hr: { nodeType: 'horizontal_rule' },
  li: { nodeType: 'list_item' },
  ol: { nodeType: 'ordered_list' },
  ol3: { nodeType: 'ordered_list', order: 3 },
  ul: { nodeType: 'bullet_list' },
  pre: { nodeType: 'code_block' },
  br: { nodeType: 'hard_break' },
  img: { nodeType: 'image', src: 'img.png', alt: 'x' },
  a: { markType: 'link', href: 'https://example.com' },
  abbr: { nodeType: 'abbr', title: 'Cascading Style Sheets' },
  aside: { nodeType: 'aside' },
  figure: { nodeType: 'figure' },
}) as any;

export const tdoc = (...args: Parameters<typeof tnodes.doc>) => tnodes.doc('', ...args);
