/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import rawHandler from '../index';
import { getBlockContent } from '../../serializer';

describe( 'rawHandler', () => {
	it( 'should filter inline content', () => {
		const filtered = rawHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		equal( filtered, '<em>test</em>' );
	} );

	it( 'should parse Markdown', () => {
		const filtered = rawHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		equal( filtered, '<ul>\n    <li>one</li>\n    <li>two</li>\n    <li>three</li>\n</ul>' );
	} );

	it( 'should parse inline Markdown', () => {
		const filtered = rawHandler( {
			HTML: 'Some **bold** text.',
			plainText: 'Some **bold** text.',
			mode: 'AUTO',
		} );

		equal( filtered, 'Some <strong>bold</strong> text.' );
	} );

	it( 'should parse HTML in plainText', () => {
		const filtered = rawHandler( {
			HTML: '&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
			plainText: '<p>Some <strong>bold</strong> text.</p>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		equal( filtered, '<p>Some <strong>bold</strong> text.</p>' );
	} );

	it( 'should break up forced inline content', () => {
		const filtered = rawHandler( {
			HTML: '<p>test</p><p>test</p>',
			mode: 'INLINE',
		} );

		equal( filtered, 'test<br>test' );
	} );
} );

import './integration';
