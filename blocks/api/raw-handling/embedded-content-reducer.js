/**
 * Internal dependencies
 */
import { isEmbedded } from './utils';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

/**
 * This filter takes embedded content out of paragraphs.
 *
 * @param {Node}     node The node to filter.
 * @param {Document} doc  The document of the node.
 *
 * @return {void}
 */
export default function( node, doc ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! isEmbedded( node ) ) {
		return;
	}

	let nodeToInsert = node;

	// if the embedded is an image and its parent is an anchor with just the image
	// take the anchor out instead of just the image
	if (
		'IMG' === node.nodeName &&
		1 === node.parentNode.childNodes.length &&
		'A' === node.parentNode.nodeName
	) {
		nodeToInsert = node.parentNode;
	}

	let wrapper = nodeToInsert;

	while ( wrapper && wrapper.nodeName !== 'P' ) {
		wrapper = wrapper.parentElement;
	}

	const figure = doc.createElement( 'figure' );

	if ( wrapper ) {
		wrapper.parentNode.insertBefore( figure, wrapper );
	} else {
		nodeToInsert.parentNode.insertBefore( figure, nodeToInsert );
	}

	figure.appendChild( nodeToInsert );
}
