/**
 * External dependencies
 */
import { includes, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { unwrap, insertAfter } from '@wordpress/utils';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

/**
 * An array of tag groups used by isInlineForTag function.
 * If tagName and nodeName are present in the same group, the node should be treated as inline.
 * @type {Array}
 */
const phrasingContentTagGroups = [
	[ 'ul', 'li', 'ol' ],
	[ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
];

/**
 * Tree of possible paths for phrasing content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 *
 * @type {Object}
 */
const phrasingContentSchema = {
	strong: {},
	em: {},
	del: {},
	ins: {},
	a: { attributes: [ 'href' ] },
	code: {},
	abbr: { attributes: [ 'title' ] },
	sub: {},
	sup: {},
	br: {},
	'#text': {},
};

// Recursion is needed.
// Possible: strong > em > strong.
// Impossible: strong > strong.
[ 'strong', 'em', 'del', 'ins', 'a', 'code', 'abbr', 'sub', 'sup' ].forEach( ( tag ) => {
	phrasingContentSchema[ tag ].children = omit( phrasingContentSchema, tag );
} );

/**
 * Tree of possible paths for list content.
 *
 * @type {Object}
 */
const listContentSchema = {
	...phrasingContentSchema,
	ul: {},
	ol: { attributes: [ 'type' ] },
};

// Recursion is needed.
// Possible: ul > li > ul.
// Impossible: ul > ul.
[ 'ul', 'ol' ].forEach( ( tag ) => {
	listContentSchema[ tag ].children = {
		li: {
			children: listContentSchema,
		},
	};
} );

/**
 * Tree of possible paths for embedded content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Embedded_content
 *
 * @type {Object}
 */
const embeddedContentSchema = {
	img: {
		attributes: [ 'src', 'alt' ],
		classes: [ 'alignleft', 'aligncenter', 'alignright', 'alignnone' ],
	},
	iframe: {
		attributes: [ 'src', 'allowfullscreen', 'height', 'width' ],
	},
};

/**
 * Tree of possible paths for block content.
 *
 * @type {Object}
 */
const blockContentSchema = {
	'wp-block': { attributes: 'data-block' },
	ol: listContentSchema.ol,
	ul: listContentSchema.ul,
	h1: {
		children: phrasingContentSchema,
	},
	h2: {
		children: phrasingContentSchema,
	},
	h3: {
		children: phrasingContentSchema,
	},
	h4: {
		children: phrasingContentSchema,
	},
	h5: {
		children: phrasingContentSchema,
	},
	h6: {
		children: phrasingContentSchema,
	},
	p: {
		children: phrasingContentSchema,
	},
	pre: {
		children: phrasingContentSchema,
	},
	figure: {
		children: {
			...embeddedContentSchema,
			figcaption: {
				children: phrasingContentSchema,
			},
		},
	},
	blockquote: {},
	hr: {},
	table: {
		children: {
			thead: {
				children: {
					tr: {
						children: {
							th: {
								children: phrasingContentSchema,
							},
							td: {
								children: phrasingContentSchema,
							},
						},
					},
				},
			},
			tfoot: {
				children: {
					tr: {
						children: {
							th: {
								children: phrasingContentSchema,
							},
							td: {
								children: phrasingContentSchema,
							},
						},
					},
				},
			},
			tbody: {
				children: {
					tr: {
						children: {
							th: {
								children: phrasingContentSchema,
							},
							td: {
								children: phrasingContentSchema,
							},
						},
					},
				},
			},
		},
	},
};

// A blockquote can contain any of the above.
blockContentSchema.blockquote.children = omit( blockContentSchema, 'blockquote' );

const contentSchema = {
	...phrasingContentSchema,
	...blockContentSchema,
};

export function getPhrasingContentSchema() {
	return phrasingContentSchema;
}

export function getContentSchema( { iframe } ) {
	const children = contentSchema.figure.children;

	return {
		...contentSchema,
		figure: {
			...contentSchema.figure,
			children: iframe ? children : omit( children, 'iframe' ),
		},
	};
}

/**
 * Checks if nodeName should be treated as inline when being added to tagName.
 * This happens if nodeName and tagName are in the same group defined in phrasingContentTagGroups.
 *
 * @param {string} nodeName Node name.
 * @param {string} tagName  Tag name.
 *
 * @return {boolean} True if nodeName is inline in the context of tagName and
 *                    false otherwise.
 */
function isInlineForTag( nodeName, tagName ) {
	if ( ! tagName || ! nodeName ) {
		return false;
	}
	return phrasingContentTagGroups.some( tagGroup =>
		includes( tagGroup, nodeName ) && includes( tagGroup, tagName )
	);
}

export function isInline( node, tagName ) {
	const nodeName = node.nodeName.toLowerCase();
	return phrasingContentSchema.hasOwnProperty( nodeName ) || isInlineForTag( nodeName, tagName );
}

export function isPhrasingContent( node ) {
	const tagName = node.nodeName.toLowerCase();
	return phrasingContentSchema.hasOwnProperty( tagName ) || tagName === 'span';
}

export function isBlockContent( node ) {
	const tagName = node.nodeName.toLowerCase();
	return blockContentSchema.hasOwnProperty( tagName );
}

/**
 * Whether or not the given node is embedded content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Embedded_content
 *
 * @param {Node} node The node to check.
 *
 * @return {boolean} True if embedded content, false if not.
 */
export function isEmbedded( node ) {
	return embeddedContentSchema.hasOwnProperty( node.nodeName.toLowerCase() );
}

export function isDoubleBR( node ) {
	return node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
}

export function isEmpty( element ) {
	if ( ! element.hasChildNodes() ) {
		return true;
	}

	return Array.from( element.childNodes ).every( ( node ) => {
		if ( node.nodeType === TEXT_NODE ) {
			return ! node.nodeValue.trim();
		}

		if ( node.nodeType === ELEMENT_NODE ) {
			if ( node.nodeName === 'BR' ) {
				return true;
			} else if ( node.hasAttributes() ) {
				return false;
			}

			return isEmpty( node );
		}

		return true;
	} );
}

export function isPlain( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const brs = doc.querySelectorAll( 'br' );

	// Remove all BR nodes.
	Array.from( brs ).forEach( ( node ) => {
		node.parentNode.replaceChild( document.createTextNode( '\n' ), node );
	} );

	// Merge all text nodes.
	doc.body.normalize();

	// If it's plain text, there should only be one node left.
	return doc.body.childNodes.length === 1 && doc.body.firstChild.nodeType === TEXT_NODE;
}

/**
 * Given node filters, deeply filters and mutates a NodeList.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Array}    filters  An array of functions that can mutate with the provided node.
 * @param {Document} doc      The document of the nodeList.
 */
export function deepFilterNodeList( nodeList, filters, doc ) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepFilterNodeList( node.childNodes, filters, doc );

		filters.forEach( ( filter ) => {
			// Make sure the node is still attached to the document.
			if ( ! doc.contains( node ) ) {
				return;
			}

			filter( node, doc );
		} );
	} );
}

/**
 * Given node filters, deeply filters HTML tags.
 *
 * @param {string} HTML    The HTML to filter.
 * @param {Array}  filters An array of functions that can mutate with the provided node.
 *
 * @return {string} The filtered HTML.
 */
export function deepFilterHTML( HTML, filters = [] ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterNodeList( doc.body.childNodes, filters, doc );

	return doc.body.innerHTML;
}

function cleanNodeList( nodeList, possibilities, doc ) {
	Array.from( nodeList ).forEach( ( node ) => {
		const tag = node.nodeName.toLowerCase();

		if ( possibilities.hasOwnProperty( tag ) ) {
			if ( node.nodeType === ELEMENT_NODE ) {
				const { attributes = [], classes = [], children } = possibilities[ tag ];

				if ( ! node.hasChildNodes() && children ) {
					node.parentNode.removeChild( node );
					return;
				}

				if ( isEmpty( node ) && children ) {
					node.parentNode.removeChild( node );
					return;
				}

				Array.from( node.attributes ).forEach( ( { name } ) => {
					if ( name === 'class' || attributes.indexOf( name ) !== -1 ) {
						return;
					}

					node.removeAttribute( name );
				} );

				const oldClasses = node.getAttribute( 'class' ) || '';
				const newClasses = oldClasses
					.split( ' ' )
					.filter( ( name ) => name && classes.indexOf( name ) !== -1 )
					.join( ' ' );

				if ( newClasses.length ) {
					node.setAttribute( 'class', newClasses );
				} else {
					node.removeAttribute( 'class' );
				}

				if ( node.hasChildNodes() ) {
					if ( children ) {
						cleanNodeList( node.childNodes, children, doc );
					} else {
						while ( node.firstChild ) {
							node.removeNode( node.firstChild );
						}
					}
				}
			}
		} else {
			cleanNodeList( node.childNodes, possibilities, doc );

			if ( blockContentSchema.hasOwnProperty( node.nodeName.toLowerCase() ) && node.nextElementSibling ) {
				insertAfter( doc.createElement( 'br' ), node );
			}

			unwrap( node );
		}
	} );
}

export function removeInvalidHTML( HTML, possibilities ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	cleanNodeList( doc.body.childNodes, possibilities, doc );

	return doc.body.innerHTML;
}
