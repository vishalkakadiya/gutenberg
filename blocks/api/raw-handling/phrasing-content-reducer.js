/**
 * WordPress dependencies
 */
import { unwrap, replaceTag } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { isPhrasingContent, isBlockContent } from './utils';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( node.nodeName === 'SPAN' ) {
		const fontWeight = node.style.fontWeight;
		const fontStyle = node.style.fontStyle;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			node = replaceTag( node, 'strong' );
		} else if ( fontStyle === 'italic' ) {
			node = replaceTag( node, 'em' );
		}
	}

	if ( node.nodeName === 'B' ) {
		node = replaceTag( node, 'strong' );
	}

	if ( node.nodeName === 'I' ) {
		node = replaceTag( node, 'em' );
	}

	if (
		isPhrasingContent( node ) &&
		node.hasChildNodes() &&
		Array.from( node.childNodes ).some( isBlockContent )
	) {
		unwrap( node );
	}
}
