/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { ReusableBlockSettings } from '../reusable-block-settings';

describe( 'ReusableBlockSettings', () => {
	beforeAll( () => {
		registerBlockType( 'test/shareable', {
			title: 'Consider Sharing Me',
			category: 'common',
			save: () => null,
		} );
		registerBlockType( 'test/unshareable', {
			title: 'Don\'t You Dare Share Me',
			category: 'common',
			supports: { sharing: false },
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/shareable' );
		unregisterBlockType( 'test/unshareable' );
	} );

	it( 'should allow converting a static block to reusable', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				block={ { name: 'test/shareable' } }
				reusableBlock={ null }
				onConvertToReusable={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).children().text();
		expect( text ).toEqual( 'Convert to Shared Block' );

		wrapper.find( 'IconButton' ).simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a reusable block to static', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				block={ { name: 'core/block' } }
				reusableBlock={ {} }
				onConvertToStatic={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).first().children().text();
		expect( text ).toEqual( 'Convert to Regular Block' );

		wrapper.find( 'IconButton' ).first().simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow deleting a reusable block', () => {
		const onDelete = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				block={ { name: 'core/block' } }
				reusableBlock={ { id: 123 } }
				onDelete={ onDelete }
			/>
		);

		const text = wrapper.find( 'IconButton' ).last().children().text();
		expect( text ).toEqual( 'Delete Shared Block' );

		wrapper.find( 'IconButton' ).last().simulate( 'click' );
		expect( onDelete ).toHaveBeenCalledWith( 123 );
	} );

	it( 'should render null when block does not support sharing', () => {
		const wrapper = shallow(
			<ReusableBlockSettings
				block={ { name: 'test/unshareable' } }
				reusableBlock={ null }
			/>
		);

		expect( wrapper.isEmptyRender() ).toBe( true );
	} );
} );
