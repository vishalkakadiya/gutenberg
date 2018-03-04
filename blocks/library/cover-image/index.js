/**
 * WordPress dependencies
 */
import { IconButton, PanelBody, RangeControl, ToggleControl, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { createBlock } from '../../api';
import MediaUpload from '../../media-upload';
import ImagePlaceholder from '../../image-placeholder';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import InnerBlocks from '../../inner-blocks';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

const blockAttributes = {
	url: {
		type: 'string',
	},
	align: {
		type: 'string',
	},
	id: {
		type: 'number',
	},
	hasParallax: {
		type: 'boolean',
		default: false,
	},
	dimRatio: {
		type: 'number',
		default: 50,
	},
};

export const name = 'core/cover-image';

export const settings = {
	title: __( 'Cover Image' ),

	description: __( 'Cover Image is a bold image block with an optional title.' ),

	icon: 'cover-image',

	category: 'common',

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => (
					createBlock( 'core/cover-image', { title: content } )
				),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { title } ) => (
					createBlock( 'core/heading', { content: title } )
				),
			},
		],
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { align, url, id, hasParallax, dimRatio } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		const style = backgroundImageStyles( url );
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const controls = isSelected && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectImage }
						type="image"
						value={ id }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit image' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<PanelBody title={ __( 'Cover Image Settings' ) }>
					<ToggleControl
						label={ __( 'Fixed Background' ) }
						checked={ !! hasParallax }
						onChange={ toggleParallax }
					/>
					<RangeControl
						label={ __( 'Background Dimness' ) }
						value={ dimRatio }
						onChange={ setDimRatio }
						min={ 0 }
						max={ 100 }
						step={ 10 }
					/>
				</PanelBody>
			</InspectorControls>,
		];

		if ( ! url ) {
			const icon = 'format-image';
			const label = __( 'Cover Image' );

			return [
				controls,
				<ImagePlaceholder key="cover-image-placeholder"
					{ ...{ className, icon, label, onSelectImage } }
				/>,
			];
		}

		return [
			controls,
			<div
				key="preview"
				data-url={ url }
				style={ style }
				className={ classes }
			>
				<div className="wp-block-cover-image__inner-container">
					<InnerBlocks
						template={ [
							[ 'core/paragraph', {
								align: 'center',
								fontSize: 'large',
								placeholder: __( 'Write title…' ),
								textColor: '#fff',
							} ],
						] }
						allowedBlocks={ [ 'core/button', 'core/heading', 'core/paragraph', 'core/subhead' ] }
					/>
				</div>
			</div>,
		];
	},

	save( { attributes, className } ) {
		const { url, hasParallax, dimRatio, align } = attributes;
		const style = backgroundImageStyles( url );
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
			align ? `align${ align }` : null,
		);

		return (
			<div className={ classes } style={ style }>
				<div className="wp-block-cover-image__inner-container">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
			title: {
				type: 'array',
				source: 'children',
				selector: 'h2',
			},
		},

		save( { attributes, className } ) {
			const { url, title, hasParallax, dimRatio, align } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				className,
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
				},
				align ? `align${ align }` : null,
			);

			return (
				<section className={ classes } style={ style }>
					<h2>{ title }</h2>
				</section>
			);
		},
	} ],
};

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		undefined;
}
