/**
 * External dependencies
 */
import showdown from 'showdown';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockType, getUnknownTypeHandlerName } from '../registration';
import { getBlockAttributes, parseWithGrammar } from '../parser';
import normaliseBlocks from './normalise-blocks';
import specialCommentConverter from './special-comment-converter';
import isInlineContent from './is-inline-content';
import phrasingContentReducer from './phrasing-content-reducer';
import msListConverter from './ms-list-converter';
import listReducer from './list-reducer';
import imageCorrector from './image-corrector';
import blockquoteNormaliser from './blockquote-normaliser';
import embeddedContentReducer from './embedded-content-reducer';
import { deepFilterHTML, isPlain, getContentSchema, getPhrasingContentSchema, removeInvalidHTML } from './utils';
import shortcodeConverter from './shortcode-converter';
import slackMarkdownVariantCorrector from './slack-markdown-variant-corrector';

/**
 * Converts an HTML string to known blocks. Strips everything else.
 *
 * @param {string}  [options.HTML]                     The HTML to convert.
 * @param {string}  [options.plainText]                Plain text version.
 * @param {string}  [options.mode]                     Handle content as blocks or inline content.
 *                                                     * 'AUTO': Decide based on the content passed.
 *                                                     * 'INLINE': Always handle as inline content, and return string.
 *                                                     * 'BLOCKS': Always handle as blocks, and return array of blocks.
 * @param {Array}   [options.tagName]                  The tag into which content will be inserted.
 * @param {boolean} [options.canUserUseUnfilteredHTML] Whether or not to user can use unfiltered HTML.
 *
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export default function rawHandler( { HTML, plainText = '', mode = 'AUTO', tagName, canUserUseUnfilteredHTML = false } ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// If we detect block delimiters, parse entirely as blocks.
	if ( mode !== 'INLINE' && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	// Parse Markdown (and HTML) if:
	// * There is a plain text version.
	// * The HTML version has no formatting.
	if ( plainText && isPlain( HTML ) ) {
		const converter = new showdown.Converter();

		converter.setOption( 'noHeaderId', true );
		converter.setOption( 'tables', true );
		converter.setOption( 'literalMidWordUnderscores', true );
		converter.setOption( 'omitExtraWLInCodeBlocks', true );
		converter.setOption( 'simpleLineBreaks', true );

		plainText = slackMarkdownVariantCorrector( plainText );

		HTML = converter.makeHtml( plainText );

		// Switch to inline mode if:
		// * The current mode is AUTO.
		// * The original plain text had no line breaks.
		// * The original plain text was not an HTML paragraph.
		// * The converted text is just a paragraph.
		if (
			mode === 'AUTO' &&
			plainText.indexOf( '\n' ) === -1 &&
			plainText.indexOf( '<p>' ) !== 0 &&
			HTML.indexOf( '<p>' ) === 0
		) {
			mode = 'INLINE';
		}
	}

	// An array of HTML strings and block objects. The blocks replace matched shortcodes.
	const pieces = shortcodeConverter( HTML );

	// The call to shortcodeConverter will always return more than one element if shortcodes are matched.
	// The reason is when shortcodes are matched empty HTML strings are included.
	const hasShortcodes = pieces.length > 1;

	// True if mode is auto, no shortcode is included and HTML verifies the isInlineContent condition
	const isAutoModeInline = mode === 'AUTO' && isInlineContent( HTML, tagName ) && ! hasShortcodes;

	// Return filtered HTML if condition is true
	if ( mode === 'INLINE' || isAutoModeInline ) {
		HTML = deepFilterHTML( HTML, [ phrasingContentReducer ] );
		HTML = removeInvalidHTML( HTML, getPhrasingContentSchema() );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	// Before we parse any HTML, extract shorcodes so they don't get messed up.
	return pieces.reduce( ( accu, piece ) => {
		// Already a block from shortcode.
		if ( typeof piece !== 'string' ) {
			return [ ...accu, piece ];
		}

		piece = deepFilterHTML( piece, [
			msListConverter,
			listReducer,
			imageCorrector,
			phrasingContentReducer,
			specialCommentConverter,
			embeddedContentReducer,
			blockquoteNormaliser,
		] );

		piece = removeInvalidHTML( piece, getContentSchema( { iframe: canUserUseUnfilteredHTML } ) );
		piece = normaliseBlocks( piece );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed HTML piece:\n\n', piece );

		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = piece;

		const transformsFrom = getBlockTransforms( 'from' );

		const blocks = Array.from( doc.body.children ).map( ( node ) => {
			const transformation = findTransform( transformsFrom, ( transform ) => (
				transform.type === 'raw' &&
				transform.isMatch( node )
			) );

			if ( transformation ) {
				if ( transformation.transform ) {
					return transformation.transform( node );
				}

				return createBlock(
					transformation.blockName,
					getBlockAttributes(
						getBlockType( transformation.blockName ),
						node.outerHTML
					)
				);
			}

			return createBlock( getUnknownTypeHandlerName(), {
				content: node.outerHTML,
			} );
		} );

		return [ ...accu, ...blocks ];
	}, [] );
}
