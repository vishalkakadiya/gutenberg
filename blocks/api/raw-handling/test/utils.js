/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import { isEmpty, isPlain } from '../utils';

describe( 'isEmpty', () => {
	function isEmptyHTML( HTML ) {
		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = HTML;

		return isEmpty( doc.body );
	}

	it( 'should return true for empty element', () => {
		equal( isEmptyHTML( '' ), true );
	} );

	it( 'should return true for element with only whitespace', () => {
		equal( isEmptyHTML( ' ' ), true );
	} );

	it( 'should return true for element with non breaking space', () => {
		equal( isEmptyHTML( '&nbsp;' ), true );
	} );

	it( 'should return true for element with BR', () => {
		equal( isEmptyHTML( '<br>' ), true );
	} );

	it( 'should return true for element with empty element', () => {
		equal( isEmptyHTML( '<em></em>' ), true );
	} );

	it( 'should return false for element with image', () => {
		equal( isEmptyHTML( '<img src="">' ), false );
	} );

	it( 'should return true for element with mixed empty pieces', () => {
		equal( isEmptyHTML( ' <br><br><em>&nbsp; </em>' ), true );
	} );
} );

describe( 'isPlain', () => {
	it( 'should return true for plain text', () => {
		equal( isPlain( 'test' ), true );
	} );

	it( 'should return true for only line breaks', () => {
		equal( isPlain( 'test<br>test' ), true );
	} );

	it( 'should return false for formatted text', () => {
		equal( isPlain( '<strong>test</strong>' ), false );
	} );
} );
